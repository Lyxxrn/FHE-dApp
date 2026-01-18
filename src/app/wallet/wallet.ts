import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { WalletService } from '../services/wallet.service';

@Component({
  selector: 'app-wallet',
  imports: [ButtonModule, CardModule],
  templateUrl: './wallet.html',
  styleUrl: './wallet.css',
})
export class Wallet {
	protected readonly wallet = inject(WalletService);
}
