import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { BondActionsComponent } from '../bond-actions/bond-actions';
import { CoFheService, BondSummaryType } from '../../services/co-fhe.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bond-summary',
  imports: [CommonModule, SkeletonModule, TableModule, ButtonModule, BondActionsComponent],
  templateUrl: './bond-summary.html',
  styleUrl: './bond-summary.css',
})
export class BondSummary {

  protected readonly cofhe = inject(CoFheService);
  private readonly router = inject(Router);
  bondSummary: BondSummaryType[] = [];
  actionsVisible = false;
  selectedBond: BondSummaryType | null = null;

  constructor () {
    effect(() => {
      this.bondSummary = this.cofhe.bondsSummary();
    });
  }

  openBondActions(bond: BondSummaryType) {
    this.selectedBond = bond;
    this.actionsVisible = true;
  }

  get isInvestor(): boolean {
    return this.router.url.startsWith('/investor');
  }

}
