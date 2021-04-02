import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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

  @ViewChild("avatar_img") avatarImage: ElementRef;

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
  avatar = new FormControl('', []);
  avatarFile = new FormControl('', []);

  constructor(
    private formBuilder: FormBuilder,
    public auth: AuthService,
    private userService: UserService,
    private changeDetector: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.accountForm = this.formBuilder.group({
      _id: this._id,
      username: this.username,
      email: this.email,
      role: this.role,
      avatar: this.avatar,
      avatarFile: this.avatarFile
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
      data => {
        this.accountForm.patchValue(data);
        this.auth.currentUser = data;
        this.auth.isAdmin = data.role === 'admin';
      },
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
          this.getUser();
        },
        error => iziToast.error({ message: 'Email already exists.' })
      );
    } else {
      iziToast.error({ message: 'Some values are invalid, please check.' });
    }
  }

  onChangeAvatar(files: File[]): void {
    const reader = new FileReader();
    if (files && files.length) {
      const [file] = files;
      this.accountForm.patchValue({
        avatarFile: file
      });
      reader.readAsDataURL(file);
      reader.onload = () => {
        //here the file can be showed (base 64 is on reader.result)
        this.avatarImage.nativeElement.src = reader.result;
        //need to run change detector since file load runs outside of zone
        this.changeDetector.markForCheck();
      };
    }
  }

}
