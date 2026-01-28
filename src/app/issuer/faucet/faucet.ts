import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { environment } from '../../../environments/environment.development';
import { CoFheService, BondData } from '../../services/co-fhe.service';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { WalletService } from '../../services/wallet.service';
import { mockLurcAbi } from '../../../generated';
import { parseUnits } from 'viem';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-faucet',
  imports: [ReactiveFormsModule, DatePickerModule, ButtonModule, InputGroupModule, InputGroupAddonModule, InputNumberModule, InputTextModule, FormsModule],
  templateUrl: './faucet.html',
  styleUrl: './faucet.css',
  standalone: true
})
export class Faucet {
  private fb = inject(FormBuilder);
  private coFhe = inject(CoFheService);
  private wallet = inject(WalletService);
  private messageService = inject(MessageService);

  emitForm = this.fb.group({
    address: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required] }),
    amount: this.fb.control<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] })
  });

  loading = false;

  async onSubmit() {
    if (this.emitForm.invalid) {
      this.emitForm.markAllAsTouched();
      return;
    }
    const { address, amount } = this.emitForm.getRawValue();
    this.loading = true;
    try {
      this.messageService.add({
        severity: 'info',
        summary: 'LURC',
        detail: 'Die Transaktion wird eingereicht. Bitte überprüfen Sie Ihre Wallet.'
      });
      const amountBig = parseUnits(String(amount), 18);
      const hash = await writeContract(this.wallet.config, {
        abi: mockLurcAbi,
        address: environment.lurcAddress as `0x${string}`,
        functionName: 'mint',
        args: [address as `0x${string}`, amountBig],
        gas: 16_000_000n
      });

      this.messageService.add({
        severity: 'info',
        summary: 'LURC',
        detail: `Die Tokens werden gemintet. Transaktions-Hash: ${hash}`
      });

      const receipt = await waitForTransactionReceipt(this.wallet.config, {
        hash,
        confirmations: 1,
        timeout: 180_000
      });

      this.messageService.add({
        severity: 'info',
        summary: 'LURC',
        detail: `Die Tokens wurden erfolgreich ausgegeben. Transaktions-Hash: ${receipt.transactionHash}`
      });
    } finally {
      this.loading = false;
    }
  }
}
