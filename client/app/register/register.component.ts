import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';

import { UserService } from '../services/user.service';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LoginComponent } from '../login/login.component';
import { AuthService } from '../services/auth.service';

declare var iziToast;

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {

  registerForm: FormGroup;
  username = new FormControl('', [
    Validators.required,
    Validators.minLength(4),
    Validators.maxLength(30),
    Validators.pattern('[a-zA-Z0-9_-\\s]*')
  ]);
  email = new FormControl('', [
    Validators.required,
    Validators.maxLength(100),
    Validators.email
  ]);
  password = new FormControl('', [
    Validators.required,
    Validators.minLength(6),
    Validators.maxLength(30)
  ]);
  confirmPassword = new FormControl('', [
    Validators.required,
    Validators.minLength(6),
    Validators.maxLength(30),
    equalsValidator(this.password)
  ]);
  role = new FormControl('', [
    Validators.required
  ]);

  constructor(
    private formBuilder: FormBuilder,
    public auth: AuthService,
    private userService: UserService,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    console.log('init register form')
    this.registerForm = this.formBuilder.group({
      username: this.username,
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword,
      role: 'user'//this.role
    });
  }

  setValid(control): object {
    return {
      'is-invalid': this[control].touched && !this[control].valid,
      'is-valid': this[control].touched && this[control].valid
    };
  }

  register(): void {
    this.registerForm.markAllAsTouched();
    if (this.registerForm.valid) {
      this.userService.register(this.registerForm.value).subscribe(
        res => {
          iziToast.success({ message: 'You successfully registered.' });
          // this.router.navigate(['/login']);
          this.modalService.dismissAll();
          this.modalService.open(LoginComponent);
        },
        error => iziToast.error({ message: 'Email already exists.' })
      );
    } else {
      iziToast.error({ message: 'Some values are invalid, please check.' });
    }
  }
}

export function equalsValidator(anotherControl: FormControl): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    return control.value != anotherControl.value ? { equals: true } : null;
  };
}
