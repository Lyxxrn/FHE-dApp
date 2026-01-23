import { Component, inject } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { CoFheService, BondSummaryType } from '../../services/co-fhe.service';
import { CofhejsError } from 'cofhejs/web';

@Component({
  selector: 'app-bond-summary',
  imports: [SkeletonModule, TableModule],
  templateUrl: './bond-summary.html',
  styleUrl: './bond-summary.css',
})
export class BondSummary {

  protected readonly cofhe = inject(CoFheService);
  bondSummary: BondSummaryType[] = [];

  constructor () {
    this.bondSummary = this.cofhe.bondsSummary();
  }

}
