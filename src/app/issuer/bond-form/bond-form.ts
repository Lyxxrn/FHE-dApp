import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { cofhejs, Encryptable} from 'cofhejs/web';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-bond-form',
  imports: [],
  templateUrl: './bond-form.html',
  styleUrl: './bond-form.css',
})
export class BondForm {

  bondModel = signal({
    paymentToken: environment.lurcAddress,
    cap: Encryptable.uint64,
    maturityDate: Encryptable.uint64,
    pricaAtIssure: Encryptable.uint64,
    couponRateperYear: Encryptable.uint64,
  });

}
