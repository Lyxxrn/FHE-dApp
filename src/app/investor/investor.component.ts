import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
	selector: 'app-investor',
	imports: [CardModule],
	templateUrl: './investor.component.html',
	styleUrl: './investor.component.css'
})
export class InvestorComponent {}
