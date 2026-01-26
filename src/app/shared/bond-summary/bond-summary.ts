import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { BondActionsComponent } from '../bond-actions/bond-actions';
import { CoFheService, BondSummaryType } from '../../services/co-fhe.service';

@Component({
  selector: 'app-bond-summary',
  imports: [CommonModule, SkeletonModule, TableModule, ButtonModule, BondActionsComponent],
  templateUrl: './bond-summary.html',
  styleUrl: './bond-summary.css',
})
export class BondSummary {

  protected readonly cofhe = inject(CoFheService);
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

}
