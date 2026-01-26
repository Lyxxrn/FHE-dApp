import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { environment } from '../../../environments/environment.development';
import { CoFheService, BondData } from '../../services/co-fhe.service';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bond-form',
  standalone: true,
  imports: [ReactiveFormsModule, DatePickerModule, ButtonModule, InputGroupModule, InputGroupAddonModule, InputNumberModule, InputTextModule, FormsModule],
  templateUrl: './bond-form.html',
  styleUrls: ['./bond-form.css'],
})
export class BondForm {
  private readonly fb = inject(FormBuilder);
  protected readonly cofhe = inject(CoFheService);

  emitForm = this.fb.group({
    paymentToken: this.fb.control<string>(environment.lurcAddress, { nonNullable: true }),
    isin: this.fb.control<string>('DE0000000001', { nonNullable: true }),
    cap: this.fb.control<number>(1000, { nonNullable: true }),
    maturityDate: this.fb.control<Date | null>(new Date(), { validators: [Validators.required] }),
    priceAtIssue: this.fb.control<number>(100, { nonNullable: true }),
    couponRatePerYear: this.fb.control<number>(5, { nonNullable: true }),
  });

  async onSubmit() {
    if (this.emitForm.invalid) {
      this.emitForm.markAllAsTouched();
      return;
    }
    const v = this.emitForm.getRawValue();
    const payload: BondData = {
      paymentToken: v.paymentToken,
      isin: v.isin,
      cap: v.cap,
      maturityDate: v.maturityDate!,
      priceAtIssue: v.priceAtIssue,
      couponRatePerYear: v.couponRatePerYear,
    };
    await this.cofhe.emitBond(payload);
  }
}
