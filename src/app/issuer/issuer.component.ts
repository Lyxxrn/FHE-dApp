import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { BondForm } from './bond-form/bond-form';

@Component({
	selector: 'app-issuer',
	imports: [CardModule, BondForm],
	templateUrl: './issuer.component.html',
	styleUrl: './issuer.component.css'
})
export class IssuerComponent {}
