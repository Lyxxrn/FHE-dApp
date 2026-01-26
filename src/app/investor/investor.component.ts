import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { BondSummary } from '../shared/bond-summary/bond-summary';

@Component({
	selector: 'app-investor',
	imports: [CardModule, BondSummary],
	templateUrl: './investor.component.html',
	styleUrl: './investor.component.css'
})
export class InvestorComponent {}
