import { Component, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { cofhejs, Encryptable} from 'cofhejs/web';
import { environment } from '../../../environments/environment.development';
import { CoFheService, BondData } from '../../services/co-fhe.service';



@Component({
  selector: 'app-bond-form',
  standalone: true,
  imports: [FormField],
  templateUrl: './bond-form.html',
  styleUrls: ['./bond-form.css'],
})
export class BondForm {

  protected readonly cofhe = inject(CoFheService);
  
  bondModel = signal<BondData>({} as BondData);
  emitForm = form(this.bondModel);

  constructor () {
    this.bondModel = signal<BondData>({
      paymentToken: environment.lurcAddress,
      cap: 1000,
      maturityDate: new Date(),
      priceAtIssue: 100,
      couponRatePerYear: 5,
    });
    this.emitForm = form(this.bondModel);
  }
  async onSubmit() {
    console.log('Start Emitting');
    await this.cofhe.emitBond(this.bondModel());
    console.log('End Emitting');
  }
}
