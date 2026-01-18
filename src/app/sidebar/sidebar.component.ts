import { Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
	selector: 'app-sidebar',
	imports: [FormsModule, RouterLink, RouterLinkActive, ToggleSwitchModule],
	templateUrl: './sidebar.component.html',
	styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
	private readonly document = inject(DOCUMENT);

	private readonly storageKey = 'theme.dark';

	isDarkMode = false;

	readonly linkItems: MenuItem[] = [
		{ label: 'Sepolia Etherscan', icon: 'pi pi-external-link', url: 'https://sepolia.etherscan.io', target: '_blank' },
		{ label: 'Fhenix', icon: 'pi pi-external-link', url: 'https://fhenix.io', target: '_blank' },
		{ label: 'Wagmi', icon: 'pi pi-external-link', url: 'https://wagmi.sh/', target: '_blank' }
	];

	readonly navItems: MenuItem[] = [
		{ label: 'Investor', icon: 'pi pi-briefcase', routerLink: '/investor' },
		{ label: 'Issuer', icon: 'pi pi-building', routerLink: '/issuer' }
	];

	constructor() {
		const saved = this.document.defaultView?.localStorage?.getItem(this.storageKey);
		this.isDarkMode = saved === 'true';
		this.applyDarkClass();
	}

	onDarkModeChange(value: boolean) {
		this.isDarkMode = value;
		this.document.defaultView?.localStorage?.setItem(this.storageKey, String(value));
		this.applyDarkClass();
	}

	private applyDarkClass() {
		const html = this.document.documentElement;
		const body = this.document.body;
		if (this.isDarkMode) {
			html.classList.add('dark');
			body.classList.add('dark');
		} else {
			html.classList.remove('dark');
			body.classList.remove('dark');
		}
	}
}
