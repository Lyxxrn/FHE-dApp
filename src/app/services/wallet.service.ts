import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
	Config,
	connect,
	createConfig,
	disconnect,
	getConnection,
	http,
	reconnect,
	switchChain,
	watchConnection,
	getPublicClient,
	getWalletClient,
	getConnectorClient,
} from '@wagmi/core';

import { metaMask } from 'wagmi/connectors';

import { environment } from '../../environments/environment.development';
import { cofhejs, Environment, Permit, Result } from 'cofhejs/web';
import initTfheWasm from 'tfhe';
import tfheWasmUrl from 'tfhe/tfhe_bg.wasm?url';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class WalletService {
	private readonly document = inject(DOCUMENT);
	private enforcingChain = false;
	private readonly stopWatchConnection: (() => void) | null;
	private tfheInitPromise: Promise<unknown> | null = null;
	private messageService = inject(MessageService);

	readonly config: Config = createConfig({
		ssr: false,
		chains: [environment.chain],
		connectors: [
			metaMask({
				infuraAPIKey: environment.infuraApiKey,
				dappMetadata: {
					name: 'FHE-dAPP',
					url: this.document.defaultView?.location?.href ?? 'http://localhost',
				},
			}),
		],
		transports: {
			[environment.chain.id]: http(),
		},
	});

	readonly address = signal<string | null>(null);
	readonly chainId = signal<number | null>(null);
	readonly isConnecting = signal(false);
	readonly error = signal<string | null>(null);
	readonly isCofheConnected = signal(false);
	readonly coFhe = signal<Result<Permit | undefined>>({ ok: true, value: undefined } as unknown as Result<Permit | undefined>);

	readonly isConnected = computed(() => !!this.address());
	readonly shortAddress = computed(() => {
		const addr = this.address();
		if (!addr) return null;
		return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
	});

	constructor() {
		this.stopWatchConnection = watchConnection(this.config, {
			onChange: (connection) => {
				this.isConnecting.set(connection.status === 'connecting' || connection.status === 'reconnecting');
				this.address.set(connection.status === 'connected' ? (connection.address as string) : null);
				this.chainId.set(connection.status === 'connected' ? connection.chainId : null);
				if (connection.status !== 'connected') return;
				// void this.ensureSepolia();
				void this.initCoFhe();
			},
		});

		// Try to re-hydrate connection state on refresh (wagmi remembers recent connector)
		void reconnect(this.config);
	}

	async connect(): Promise<void> {
		this.error.set(null);

		this.isConnecting.set(true);
		try {
			const connector = this.config.connectors[0]!;
			await connect(this.config, {
				connector,
				chainId: environment.chain.id,
			});

			// Sync immediately (watchConnection will also do this)
			const connection = getConnection(this.config);
			this.address.set(connection.status === 'connected' ? (connection.address as string) : null);
			this.chainId.set(connection.status === 'connected' ? connection.chainId : null);

			await this.ensureSepolia();

			await this.initCoFhe();
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			this.error.set(message || 'Wallet-Verbindung fehlgeschlagen.');
		} finally {
			this.isConnecting.set(false);
		}
	}

	async disconnect(): Promise<void> {
		try {
			await disconnect(this.config);
		} finally {
			this.resetState();
		}
	}

	private async ensureSepolia(): Promise<void> {
		const connection = getConnection(this.config);
		if (connection.status !== 'connected') return;

		if (connection.chainId === environment.chain.id) return;
		if (this.enforcingChain) return;
		this.enforcingChain = true;

		try {
			await switchChain(this.config, { chainId: environment.chain.id });
			this.error.set(null);
		} catch (e) {
			// If user rejects switching, we enforce by disconnecting.
			await this.disconnect();
			const message = e instanceof Error ? e.message : String(e);
			this.error.set(
				`Bitte verbinde dich mit ${environment.chain.name} (ChainId ${environment.chain.id}). ${message}`,
			);
		} finally {
			this.enforcingChain = false;
		}
	}

	private resetState() {
		this.address.set(null);
		this.chainId.set(null);
		this.isConnecting.set(false);
		this.error.set(null);
	}

	private async initCoFhe() {
		try {
			const connection = getConnection(this.config);
			if (connection.status !== 'connected') return;

			await this.ensureTfheInitialized();

			const viemClient = getPublicClient(this.config, { chainId: environment.chain.id });
			const viemWalletClient = await getWalletClient(this.config, { chainId: environment.chain.id });

			this.coFhe.set(
				await cofhejs.initializeWithViem({
					viemClient: viemClient,
					viemWalletClient: viemWalletClient,
					environment: 'TESTNET',
					// this is the only permit that is needed in this dApp, expires after 24h
					// permits are used to allow this dApp to decrypt values from cofhe and to use allow for FHE contrats, see: https://cofhe-docs.fhenix.zone/cofhejs/guides/permits-management
					generatePermit: true 
				}),
			);
			this.isCofheConnected.set(true);
			this.messageService.add({
				severity: 'info',
				summary: 'CoFhe',
				detail: 'Die Anwendung wurde erfolgreich mit CoFhe verbunden.'
			  });
		} catch (e) {
			this.messageService.add({
				severity: 'error',
				summary: 'CoFhe',
				detail: 'Die Anwendung konnte nicht mit CoFhe verbunden werden.'
			  });
			this.isCofheConnected.set(false);
		}
	}
	
	// This is needed because tfhe would not load right without it.
	private async ensureTfheInitialized(): Promise<void> {
		if (this.tfheInitPromise) {
			await this.tfheInitPromise;
			return;
		}

		const wasmUrl = new URL(tfheWasmUrl, this.document.baseURI).toString();
		this.tfheInitPromise = initTfheWasm({ module_or_path: wasmUrl });
		await this.tfheInitPromise;
	}
}
