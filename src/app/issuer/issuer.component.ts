import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { BondForm } from './bond-form/bond-form';
import { BondSummary } from '../shared/bond-summary/bond-summary';
import { Faucet } from './faucet/faucet';

@Component({
	selector: 'app-issuer',
	imports: [CardModule, BondForm, BondSummary, Faucet],
	templateUrl: './issuer.component.html',
	styleUrl: './issuer.component.css'
})
export class IssuerComponent {}
