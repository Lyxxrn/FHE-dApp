import { inject, Injectable, signal } from '@angular/core';
import { WalletService } from './wallet.service';
import { cofhejs, Encryptable, EncryptableUint64 } from 'cofhejs/web';
import { getClient, writeContract, writeContractSync } from '@wagmi/core';
import { smartBondFactoryAbi } from '../../generated';
import { environment } from '../../environments/environment.development';
import { Hex } from 'viem';

export interface BondData {
  paymentToken: string;
  isin: string;
  cap: number;
  maturityDate: Date;
  priceAtIssue: number;
  couponRatePerYear: number;
}

interface BondDateEnc {
  paymentToken: string, // lurc does not need to be encrypted
  cap: EncryptableUint64,
  maturityDate: EncryptableUint64,
  priceAtIssue: EncryptableUint64,
  couponRatePerYear: EncryptableUint64,
}

@Injectable({
  providedIn: 'root',
})
export class CoFheService {

  //cofhe.js is allready been initialized within the WalletService
  protected readonly wallet = inject(WalletService);

  async emitBond(bond: BondData): Promise<Boolean> {
    console.log('Emitting bond: ', bond)
    try {
      // unix-timestamp in seconds because cofhe can't encrypt ts date object
      const unixSeconds: bigint = BigInt(bond.maturityDate.getTime()) / 1000n

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
      console.log('sending transaction');
      const result = await writeContractSync(this.wallet.config,{
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
      console.log('Encrypted bond: ', result)
      return true;
    }
    catch (e) {
      console.error(e);
      return false;
    }
  }
  
}
