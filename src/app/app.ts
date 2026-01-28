import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from './sidebar/sidebar.component';
import { Wallet } from './wallet/wallet';
import { WalletService } from './services/wallet.service';
import { CoFheService } from './services/co-fhe.service';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, Wallet, ToastModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
	protected readonly wallet = inject(WalletService);
  protected readonly cofhe = inject(CoFheService);
}
