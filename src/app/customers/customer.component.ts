import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl, FormArray} from '@angular/forms';
import {debounceTime} from 'rxjs/operators'

import { Customer } from './customer';

function ratingRange(min: number, max: number): ValidatorFn {
  return (c: AbstractControl): { [key: string]: boolean } | null => { // => despues del null para poner lo que queremos que valide
    if (c.value !== null && (isNaN(c.value) || c.value < min || c.value > max)) {
      return { range: true };
    }
    return null;
  };
}

function emailMatcher(c: AbstractControl): { [key: string]: boolean } | null {
  const emailControl = c.get('email');
  const confirmControl = c.get('confirmEmail');

  if (emailControl.pristine || confirmControl.pristine) {
    return null;
  }

  if (emailControl.value === confirmControl.value) {
    return null;
  }
  return { match: true };
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  customerForm : FormGroup;
  customer = new Customer();
  emailMessage : string;

  get addresses() : FormArray{ //para que nada lo modifique
    return this.customerForm.get('adresses') as FormArray;
  }

  //firstName = new FormControl(); y lo podemos agregar al FormGroup con firstName = this.firstName;

  private validationMessages = {
    required: 'Please enter your email address.',
    email: 'Please enter a valid email address.'
  }

  constructor(private fb : FormBuilder) { }

  ngOnInit() {
    this.customerForm = this.fb.group({
      firstName : ['',[Validators.required, Validators.minLength(3)]],
      lastName : ['',[Validators.required, Validators.maxLength(50)]],
      emailGroup : this.fb.group({
        email : ['',[Validators.required, Validators.email]],
        confirmEmail: ['',Validators.required]
      }, {validators:emailMatcher} /*se agrega a errors del email*/),
      phone: '',
      notification: 'email',
      rating: [null,ratingRange(1,5)],
      sendCatalog : true,
      adresses:this.fb.array([this.buildAddress()])

    });

    //Despues de definir los control
    this.customerForm.get('notification').valueChanges.subscribe(
      value => this.setNotification(value)
    );

    // this.customerForm = new FormGroup({
    //   firstName : new FormControl(),
    //   lastName : new FormControl(),
    //   email : new FormControl(),
    //   sendCatalog : new FormControl(true)
    // });

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl.valueChanges.pipe(
      debounceTime(1000)
      ).subscribe(
      value=> this.setMessage(emailControl)
    );
  }

  populateTestData(): void{
    this.customerForm.setValue({
      firstName: 'Jack',
      lastName: 'Harkness',
      email: 'jack@torchwood.com',
      rating: [null, ], //[Validators.min(1),Validators.max(5)]
      sendCatalog: false,
      addresses: this.fb.array([ this.buildAddress() ])
    })
  }
  save() {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  setMessage(c: AbstractControl): void {
    this.emailMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors).map(
        key => this.validationMessages[key]).join(' ');
    }
  }

  setNotification(notifyVia: string){
    const phoneControl = this.customerForm.get('phone');
    if (notifyVia === 'text'){
      phoneControl.setValidators(Validators.required);
    }
    else{
      phoneControl.clearValidators();
    }
    phoneControl.updateValueAndValidity(); //reevaluar el formcontrol
  }

  //Para hacer el refactor
  buildAddress(): FormGroup {
    return this.fb.group({
      addressType: 'home',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: ''
    });
  }

  //metodo para duplicar
  addAddress(): void{
    this.addresses.push(this.buildAddress())
  }
}
