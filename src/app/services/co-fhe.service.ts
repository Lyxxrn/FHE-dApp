import { effect, inject, Injectable, signal } from '@angular/core';
import { WalletService } from './wallet.service';
import { cofhejs, Encryptable, EncryptableUint64, FheTypes, Result } from 'cofhejs/web';
import { writeContract, waitForTransactionReceipt, readContract } from '@wagmi/core';
import { bondAssetTokenAbi, smartBondAbi, smartBondFactoryAbi, smartBondRegistryAbi } from '../../generated';
import { environment } from '../../environments/environment.development';
import { Hex } from 'viem';
import { MessageService } from 'primeng/api';

// input type to emit new bonds
export interface BondData {
  paymentToken: string;
  isin: string;
  cap: number;
  maturityDate: Date;
  priceAtIssue: number;
  couponRatePerYear: number;
}

// summary of bunds to be displayed in issuer dashboard
export interface BondSummaryType {
  isin: string,
  maturityDate: Date,
  couponRatePerYear: bigint,
  addressBond: String,
  addressAsset: String,
  issueDate: Date,
  subscriptionEndDate: Date,
  notionalCap: bigint,
  investorBalance: bigint,
  requiredPayout: bigint,
  balance: bigint
}

@Injectable({
  providedIn: 'root',
})
export class CoFheService {

  //state
  readonly isEmitting = signal(false);
  readonly isRedeeming = signal(false);
  readonly isSummaryLoading = signal(true);

  bondsSummary = signal<BondSummaryType[]>([]);

  //cofhe.js is allready been initialized within the WalletService
  protected readonly wallet = inject(WalletService);

  private messageService = inject(MessageService);

  constructor() {
    effect(() => {
      if(this.wallet.isCofheConnected()) {
        console.log('CoFhe is connected');
        void this.getEmittedBonds();
      }
    });
  }

  // unix-timestamp in seconds because cofhe can't encrypt ts date object
  private toUnixSeconds(date: Date): bigint {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid Date');
    }
    return BigInt(Math.floor(date.getTime() / 1000));
  }
  
  private fromUnixSeconds(ts: bigint | number | string): Date {
    const s = typeof ts === 'bigint' ? Number(ts) : Number(ts);
    return new Date(s * 1000);
  }
  
  private  unwrap<T>(r: Result<T>): T {
    return r.data as T;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async emitBond(bond: BondData): Promise<Boolean> {
    this.isEmitting.set(true);
    console.log('Emitting bond: ', bond)
    try {

      // unix-timestamp in seconds because cofhe can't encrypt ts date object
      const unixSeconds: bigint = this.toUnixSeconds(bond.maturityDate);

      this.messageService.add({
        severity: 'info',
        summary: 'CoFhe',
        detail: 'Die Verschlüsselung wird gestartet.'
      });

      // encrypt values with coFhe
      const encrypt = await cofhejs.encrypt([
        Encryptable.uint64(String(bond.cap)),
        Encryptable.uint64(String(bond.priceAtIssue)),
        Encryptable.uint64(String(bond.couponRatePerYear)),
        Encryptable.uint64(String(unixSeconds))
      ]);

      // read handles and send them to sbc factory to create new bond

      if (!encrypt.success || !encrypt.data || encrypt.data.length !== 4) {
        this.messageService.add({
          severity: 'error',
          summary: 'CoFhe',
          detail: 'Die Verschlüsselung ist fehlgeschlagen. Es wurde keine Anleihe ausgegeben.'
        });
        throw new Error('Encryption failed');
      }
      const [capEnc, priceEnc, couponEnc, maturityEnc] = encrypt.data;
      // CoFheInUint64 handles need to be casted to InUint64, because CoFheInUint64 only has a string as signature, while InUint64 expect a 0x${string}
      const toInEuint64 = (x: any) => ({ ...x, signature: x.signature as Hex });
      this.messageService.add({
        severity: 'info',
        summary: 'CoFhe',
        detail: 'Die Transaktion wird gesendet. Bitte prüfen die Ihre Wallet.'
      });
      const hash = await writeContract(this.wallet.config,{
        abi: smartBondFactoryAbi,
        address: environment.bondFactoryAddress as `0x${string}`,
        functionName: 'createBond',
        args: [
          bond.paymentToken as `0x${string}`,
          toInEuint64(capEnc),
          toInEuint64(maturityEnc),
          toInEuint64(priceEnc),
          toInEuint64(couponEnc),
          bond.isin
        ],
        gas: 16_000_000n
      });
      const receipt = await waitForTransactionReceipt(this.wallet.config, {
        hash,
        confirmations: 1,
        timeout: 180_000,
      });
      this.messageService.add({
        severity: 'success',
        summary: 'CoFhe',
        detail: `Die Anleihe wurde erfolgreich ausgegeben. Transaktions-Hash: ${receipt.transactionHash}`
      });
      this.isEmitting.set(false);
      return receipt.status === 'success';
    }
    catch (e) {
      console.error(e);
      this.isEmitting.set(false);
      return false;
    }
  }

  async getEmittedBonds() {
    this.isSummaryLoading.set(true);
    const items: BondSummaryType[] = [];
    
    // get all registered bonds (encrypted and sealed)
    const result = await readContract(this.wallet.config, {
      abi: smartBondRegistryAbi,
      address: environment.bondRegistryAddress as `0x${string}`,
      functionName: 'getAllBonds'
    });

    // this loop gets all needed bondinfo for later usage in bond-actions and bond-summary
    for (let i = 0; i < result.length; i++) {

      const assetAddr = await readContract(this.wallet.config, {
          abi: smartBondAbi,
          address: result[i].bond,
          functionName: 'assetToken'
        });

      // TODO: the dApp ist currently not allowed to read encrypted assetToken balance and coupon, needs to be fixed
      const item: BondSummaryType = {
        isin: result[i].isin,
        maturityDate: this.fromUnixSeconds(this.unwrap(await cofhejs.decrypt(result[i].maturityDate, FheTypes.Uint64))),
        couponRatePerYear: this.unwrap(await cofhejs.decrypt(
        await readContract(this.wallet.config, {
          abi: smartBondAbi,
          address: result[i].bond,
          functionName: 'couponRatePerYear'
        }),FheTypes.Uint64)),
        addressBond: result[i].bond,
        addressAsset: assetAddr,
        issueDate: this.fromUnixSeconds(result[i].issueDate),
        subscriptionEndDate: this.fromUnixSeconds(result[i].subscriptionEndDate),
        notionalCap: this.unwrap(await cofhejs.decrypt(result[i].notionalCap, FheTypes.Uint64)),
        // investorBalance: this.unwrap(await cofhejs.decrypt(
        // await readContract(this.wallet.config, {
        //   abi: bondAssetTokenAbi,
        //   address: assetAddr,
        //   functionName: 'balanceOf', 
        //   args: [this.wallet.address() as `0x${string}`]
        // }),FheTypes.Uint64))
        investorBalance: BigInt(1000), // only mockup for now until bug in fhe contract is fixed
        requiredPayout: this.unwrap(await cofhejs.decrypt(
          await readContract(this.wallet.config, {
            abi: smartBondAbi,
            address: result[i].bond,
            functionName: 'totalPayoutRequired'
          }),FheTypes.Uint64)),
        balance: this.unwrap(await cofhejs.decrypt(
          await readContract(this.wallet.config, {
            abi: bondAssetTokenAbi,
            address: assetAddr,
            functionName: 'confidentialBalanceOf',
            args: [
              this.wallet.address() as `0x${string}`
            ]
          }),FheTypes.Uint64)),
      }
      items.push(item);
    }
    this.bondsSummary.set(items);
    this.isSummaryLoading.set(false);
  }

  async redeemPayout(bond: BondSummaryType) {
    try {
      this.isRedeeming.set(true);
      this.messageService.add({
          severity: 'info',
          summary: 'CoFhe',
          detail: 'Die Verschlüsselung der Auszahlung wird gestartet.'
        });

        // encrypt value with coFhe
        const amountEnc = await cofhejs.encrypt([
          Encryptable.uint64(bond.balance.toString())
        ]);
        console.log(amountEnc.data);
        console.log(amountEnc.success);

        // read handles and send them to sbc factory to create new bond
        if (!amountEnc.success || !amountEnc.data || amountEnc.data.length !== 1) {
          this.messageService.add({
            severity: 'error',
            summary: 'CoFhe',
            detail: 'Die Verschlüsselung ist fehlgeschlagen. Es wurde keine Auszahlung durchgeführt.'
          });
          throw new Error('Encryption failed');
        }
        // CoFheInUint64 handles need to be casted to InUint64, because CoFheInUint64 only has a string as signature, while InUint64 expect a 0x${string}
        const toInEuint64 = (x: any) => ({ ...x, signature: x.signature as Hex });
        this.messageService.add({
          severity: 'info',
          summary: 'Redemption',
          detail: 'Die Redeem-Entschlüsselungs-Transaktion wird gesendet. Bitte prüfen die Ihre Wallet.'
        });

        // 1) let the smart bond decrypt the wanted amount, this is needed because the ERC-20 payment token is not compatible with Fhenix FHE and the contract needs to now, how to many payment tokens will be returned
        // this will make the redeemed amount public!
        const hash = await writeContract(this.wallet.config,{
          abi: smartBondAbi,
          address: bond.addressBond as `0x${string}`,
          functionName: 'redeem',
          args: [
            toInEuint64(amountEnc.data[0])
          ],
          gas: 16_000_000n
        });
        const receipt = await waitForTransactionReceipt(this.wallet.config, {
          hash,
          confirmations: 1,
          timeout: 180_000,
        });
        this.messageService.add({
          severity: 'success',
          summary: 'Redemption',
          detail: `Die verschlüssellten Asset Tokens wurden freigegeben und entschlüsselt. Transaktions-Hash: ${receipt.transactionHash}`
        });

        // 2) poll claim until decrypt result is ready
        this.messageService.add({
          severity: 'info',
          summary: 'Redemption',
          detail: 'Warte auf Entschlüsselung und führe Auszahlung aus...'
        });
        const maxAttempts = 30;
        const delayMs = 4000;
        let claimed = false;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            const claimHash = await writeContract(this.wallet.config,{
              abi: smartBondAbi,
              address: bond.addressBond as `0x${string}`,
              functionName: 'claimRedeem',
              args: [],
              gas: 16_000_000n
            });
            const claimReceipt = await waitForTransactionReceipt(this.wallet.config, {
              hash: claimHash,
              confirmations: 1,
              timeout: 180_000,
            });
            this.messageService.add({
              severity: 'success',
              summary: 'Redemption',
              detail: `Die Redeem-Transaktion wurde erfolgreich durchgeführt. Sie haben ihre Payment-Tokens erhalten, Transaktions-Hash: ${claimReceipt.transactionHash}`
            });
            claimed = true;
            break;
          } catch (err: any) {
            const msg = String(err?.shortMessage ?? err?.message ?? err);
            if (msg.includes('Payout decryption pending')) {
              await this.sleep(delayMs);
              continue;
            }
            throw err;
          }
        }

        if (!claimed) {
          throw new Error('Payout decryption pending');
        }
        } catch (e) {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler bei der Redemption',
            detail: `Das Redeemen war nicht erfolgreich. Fehler: ${e}`
          });
          console.error(e);
        } finally {
          this.isRedeeming.set(false);
        }
  }
}
