import { effect, inject, Injectable, signal } from '@angular/core';
import { WalletService } from './wallet.service';
import { cofhejs, Encryptable, EncryptableUint64, FheTypes, Result } from 'cofhejs/web';
import { writeContract, waitForTransactionReceipt, readContract } from '@wagmi/core';
import { smartBondAbi, smartBondFactoryAbi, smartBondRegistryAbi } from '../../generated';
import { environment } from '../../environments/environment.development';
import { Hex } from 'viem';

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
  issueDate: Date,
  subscriptionEndDate: Date,
  notionalCap: bigint
}

@Injectable({
  providedIn: 'root',
})
export class CoFheService {

  //state
  readonly isEmitting = signal(false);
  readonly isSummaryLoading = signal(true);

  bondsSummary = signal<BondSummaryType[]>([]);

  //cofhe.js is allready been initialized within the WalletService
  protected readonly wallet = inject(WalletService);

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

  async emitBond(bond: BondData): Promise<Boolean> {
    this.isEmitting.set(true);
    console.log('Emitting bond: ', bond)
    try {
      // unix-timestamp in seconds because cofhe can't encrypt ts date object
      const unixSeconds: bigint = this.toUnixSeconds(bond.maturityDate);

      // encrypt values with coFhe
      const encrypt = await cofhejs.encrypt([
        Encryptable.uint64(String(bond.cap)),
        Encryptable.uint64(String(bond.priceAtIssue)),
        Encryptable.uint64(String(bond.couponRatePerYear)),
        Encryptable.uint64(String(unixSeconds))
      ]);

      // read handles and send them to sbc factory to create new bond

      if (!encrypt.success || !encrypt.data || encrypt.data.length !== 4) {
        throw new Error('Encryption failed');
      }
      const [capEnc, priceEnc, couponEnc, maturityEnc] = encrypt.data;
      // CoFheInUint64 handles need to be casted to InUint64, because CoFheInUint64 only has a string as signature, while InUint64 expect a 0x${string}
      const toInEuint64 = (x: any) => ({ ...x, signature: x.signature as Hex });
      console.log('sending transaction');  // TODO: send this info visible via the dApp via new info component
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
      console.log('Encrypted bond receipt: ', receipt);
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

    for (let i = 0; i < result.length; i++) {

      const item: BondSummaryType = {
        isin: result[i].isin,
        maturityDate: this.fromUnixSeconds(this.unwrap(await cofhejs.decrypt(result[i].maturityDate, FheTypes.Uint64))),
        couponRatePerYear: this.unwrap(await cofhejs.decrypt(
        await readContract(this.wallet.config, {
          abi: smartBondAbi,
          address: result[i].bond,
          functionName: 'couponRatePerYear'
        }),FheTypes.Uint64)),
        issueDate: this.fromUnixSeconds(result[i].issueDate),
        subscriptionEndDate: this.fromUnixSeconds(result[i].subscriptionEndDate),
        notionalCap: this.unwrap(await cofhejs.decrypt(result[i].notionalCap, FheTypes.Uint64))
      }
      items.push(item);
    }
    this.bondsSummary.set(items);
    this.isSummaryLoading.set(false);
  }
  
}
