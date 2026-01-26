import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { BondSummaryType } from '../../services/co-fhe.service';

@Component({
  selector: 'app-bond-actions',
  imports: [CommonModule, DialogModule, ButtonModule, InputNumberModule],
  templateUrl: './bond-actions.html',
  styleUrl: './bond-actions.css',
})
export class BondActionsComponent {
  private readonly router = inject(Router);

  @Input() bond: BondSummaryType | null = null;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  get isInvestor(): boolean {
    return this.router.url.startsWith('/investor');
  }

  get isIssuer(): boolean {
    return this.router.url.startsWith('/issuer');
  }

  close() {
    this.visibleChange.emit(false);
  }
}
