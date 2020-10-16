import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { User } from '../shared/models/user.model';
import { Validators, FormControl, FormGroup, FormBuilder } from '@angular/forms';

declare var iziToast;

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {

  isLoading = true;
  accountForm: FormGroup;
  _id;
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
  role = new FormControl('', [
    Validators.required
  ]);

  constructor(
    private formBuilder: FormBuilder,
    public auth: AuthService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.accountForm = this.formBuilder.group({
      _id: this._id,
      username: this.username,
      email: this.email,
      role: this.role,
    });
    this.getUser();
  }

  setValid(control): object {
    return {
      'is-invalid': this[control].touched && !this[control].valid,
      'is-valid': this[control].touched && this[control].valid
    };
  }

  getUser(): void {
    this.userService.getUser(this.auth.currentUser).subscribe(
      data => this.accountForm.setValue(data),
      error => console.log(error),
      () => this.isLoading = false
    );
  }

  save(): void {
    this.accountForm.markAllAsTouched();
    if (this.accountForm.valid) {
      this.userService.editUser(this.accountForm.value).subscribe(
        res => {
          iziToast.success({ message: 'Account settings saved.' });
          this.auth.currentUser = this.accountForm.value;
          this.auth.isAdmin = this.accountForm.value.role === 'admin';
        },
        error => iziToast.error({ message: 'Email already exists.' })
      );
    } else {
      iziToast.error({ message: 'Some values are invalid, please check.' });
    }
  }

}
