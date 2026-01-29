import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { BondSummaryType } from '../../services/co-fhe.service';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { parseUnits } from 'viem';
import { waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { WalletService } from '../../services/wallet.service';
import { bondAssetTokenAbi, mockLurcAbi, smartBondAbi } from '../../../generated';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-bond-actions',
  imports: [CommonModule, DialogModule, ButtonModule, InputNumberModule, InputTextModule, FormsModule, ReactiveFormsModule],
  templateUrl: './bond-actions.html',
  styleUrl: './bond-actions.css',
})
export class BondActionsComponent {
  private readonly router = inject(Router);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private wallet = inject(WalletService);

  @Input() bond: BondSummaryType | null = null;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  buyForm = this.fb.group({
    amount: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
  });

  whitelistForm = this.fb.group({
    address: this.fb.control<string | null>(null, { validators: [Validators.required] }),
  });
  
  buyLoading = false;
  whitelistLoading = false;

  get isInvestor(): boolean {
    return this.router.url.startsWith('/investor');
  }

  get isIssuer(): boolean {
    return this.router.url.startsWith('/issuer');
  }

  close() {
    this.visibleChange.emit(false);
  }

  async buyBond() {
      if (this.buyForm.invalid) {
        this.buyForm.markAllAsTouched();
        return;
      }
      // The amount is guaranteed to be a number here due to the validators.
      const amount = this.buyForm.getRawValue().amount!;
      this.buyLoading = true;
      try {

        // 1) Allow the Smart Bond to take Tokens
        this.messageService.add({
          severity: 'info',
          summary: 'LURC',
          detail: 'Die Approve-Transaktion wird eingereicht. Bitte überprüfen Sie Ihre Wallet.'
        });
        const amountBig = parseUnits(String(amount), 18);
        const approveHash = await writeContract(this.wallet.config, {
          abi: mockLurcAbi,
          address: environment.lurcAddress as `0x${string}`,
          functionName: 'approve',
          args: [
            this.bond?.addressBond as `0x${string}`, 
            amountBig
          ],
          gas: 16_000_000n
        });
        const approveReceipt = await waitForTransactionReceipt(this.wallet.config, {
          hash: approveHash,
          confirmations: 1,
          timeout: 180_000
        });
        this.messageService.add({
          severity: 'info',
          summary: 'LURC',
          detail: `Die Approve-Transaktion wurde genehmitgt und erfolgreich durchgeführt. Transaktions-Hash: ${approveReceipt}`
        });
      
        // 2) buy the wanted bond
        this.messageService.add({
          severity: 'info',
          summary: 'LURC',
          detail: 'Die Buy-Transaktion wird eingereicht. Bitte überprüfen Sie Ihre Wallet.'
        });
        const buyHash = await writeContract(this.wallet.config, {
          abi: smartBondAbi,
          address: this.bond?.addressBond as `0x${string}`,
          functionName: 'buy',
          args: [
            amountBig
          ],
          gas: 16_000_000n
        });
        const buyReceipt = await waitForTransactionReceipt(this.wallet.config, {
          hash: buyHash,
          confirmations: 1,
          timeout: 180_000
        });
        this.messageService.add({
          severity: 'info',
          summary: 'SBC',
          detail: `Die Buy-Transaktion wurde genehmitgt und erfolgreich durchgeführt. Transaktions-Hash: ${buyHash}`
        });

      } catch (e) {
        this.messageService.add({
          severity: 'info',
          summary: 'Fehler beim Bondkauf',
          detail: `Der Kauf war nicht erfolgreich. Fehler: ${e}`
        });
      }
       finally {
        this.buyLoading = false;
      }
    }

    async whitelist() {
      if (this.whitelistForm.invalid) {
        this.whitelistForm.markAllAsTouched();
        return;
      }
      const { address } = this.whitelistForm.getRawValue();
      this.whitelistLoading = true;

      try {
        this.messageService.add({
          severity: 'info',
          summary: 'Asset',
          detail: 'Die Whitelist-Transaktion wird eingereicht. Bitte überprüfen Sie Ihre Wallet.'
        });
        const whitelist = await writeContract(this.wallet.config, {
          abi: bondAssetTokenAbi,
          address: this.bond?.addressAsset as `0x${string}`,
          functionName: 'setWhitelist',
          args: [
            address as `0x${string}`,
            true
          ],
          gas: 16_000_000n
        });
        const approveReceipt = await waitForTransactionReceipt(this.wallet.config, {
          hash: whitelist,
          confirmations: 1,
          timeout: 180_000
        });
        this.messageService.add({
          severity: 'info',
          summary: 'Asset',
          detail: `Die Whitelist-Transaktion wurde genehmitgt und erfolgreich durchgeführt. Transaktions-Hash: ${whitelist}`
        });

      } catch (e) {
        this.messageService.add({
          severity: 'info',
          summary: 'Fehler beim Whitelisten',
          detail: `Der Prozess war nicht erfolgreich. Fehler: ${e}`
        });
      }
       finally {
        this.whitelistLoading = false;
      }

    }
}
