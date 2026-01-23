import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { BondForm } from './bond-form/bond-form';
import { BondSummary } from '../shared/bond-summary/bond-summary';

@Component({
	selector: 'app-issuer',
	imports: [CardModule, BondForm, BondSummary],
	templateUrl: './issuer.component.html',
	styleUrl: './issuer.component.css'
})
export class IssuerComponent {}
