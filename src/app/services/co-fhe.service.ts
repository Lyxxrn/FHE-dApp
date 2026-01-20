import { inject, Injectable, signal } from '@angular/core';
import { WalletService } from './wallet.service';
import { cofhejs } from 'cofhejs/web';
import { getClient } from '@wagmi/core';

@Injectable({
  providedIn: 'root',
})
export class CoFheService {

  protected readonly wallet = inject(WalletService);
  
}
