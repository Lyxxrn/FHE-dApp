import { Routes } from '@angular/router';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'investor' },
	{
		path: 'investor',
		loadComponent: () => import('./investor/investor.component').then((m) => m.InvestorComponent)
	},
	{
		path: 'issuer',
		loadComponent: () => import('./issuer/issuer.component').then((m) => m.IssuerComponent)
	},
	{ path: '**', redirectTo: '' }
];
