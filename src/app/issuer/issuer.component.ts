import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
	selector: 'app-issuer',
	imports: [CardModule],
	templateUrl: './issuer.component.html',
	styleUrl: './issuer.component.css'
})
export class IssuerComponent {}
