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
} from '@wagmi/core';

import { metaMask } from 'wagmi/connectors';

import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class WalletService {
	private readonly document = inject(DOCUMENT);
	private enforcingChain = false;
	private readonly stopWatchConnection: (() => void) | null;

	private readonly config: Config = createConfig({
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
				void this.ensureSepolia();
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
}
