import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { User } from '../shared/models/user.model';
import { Validators, FormControl, FormGroup, FormBuilder } from '@angular/forms';
import Compressor from 'compressorjs';
import { ActivatedRoute } from '@angular/router';

declare var iziToast;

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {
  @ViewChild("avatar_img") avatarImage: ElementRef;

  user: string;
  code: string;
  verify: boolean = null;
  verifyMessage: string;

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
  verified = new FormControl(false, []);

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public auth: AuthService,
    private userService: UserService,
    private changeDetector: ChangeDetectorRef
  ) {
    this.route.params.subscribe(params => {
      this.user = params.user;
      this.code = params.code;
    });
  }

  ngOnInit(): void {

    this.accountForm = this.formBuilder.group({
      _id: this._id,
      username: this.username,
      email: this.email,
      role: this.role,
      avatar: this.avatar,
      avatarFile: this.avatarFile,
      verified: this.verified
    });
    this.getUser();
    this.sendVerify();
  }

  setValid(control): object {
    return {
      'is-invalid': this[control].touched && !this[control].valid,
      'is-valid': this[control].touched && this[control].valid
    };
  }

  getUser(): void {
    if (this.auth.loggedIn) {
      this.userService.getUser(this.auth.currentUser).subscribe(
        data => {
          this.accountForm.patchValue(data);
          this.auth.currentUser = data;
          this.auth.isAdmin = data.role === 'admin';
          this.auth.isVerified = data.verified;
        },
        error => console.log(error),
        () => this.isLoading = false
      );
    } else {
      this.isLoading = false
    }
  }

  save(): void {
    this.accountForm.markAllAsTouched();
    if (this.accountForm.valid) {
      this.userService.editUser(this.accountForm.value).subscribe(
        res => {
          iziToast.success({ message: 'Account settings saved.' });
          this.getUser();
        },
        error => {
          iziToast.error({ message: "Account settings can't be saved." + (error.error ? "<br>" + error.error : "") })
        }
      );
    } else {
      iziToast.error({ message: 'Some values are invalid, please check.' });
    }
  }

  sendVerificationEmail(): void {
    this.userService.verificationUser(this.accountForm.value).subscribe(
      res => {
        iziToast.info({ message: "Verification email sended." });
        this.getUser();
      },
      error => {
        iziToast.error({ message: "Verification email can't be sended." + (error.error ? "<br>" + error.error : "") });
      }
    );
  }

  sendVerify(): void {
    if (this.user && this.code) {
      this.userService.verifyUser(this.user, this.code).subscribe(
        res => {
          this.verify = true;
          this.verifyMessage = "Email verified successfully!";
        },
        error => {
          this.verify = false;
          this.verifyMessage = error.error;
        },
        () => this.getUser()
      );
    }
  }

  onChangeAvatar(files: File[]): void {
    const reader = new FileReader();
    if (files && files.length) {
      const [file] = files;
      new Compressor(file, {
        quality: 0.2,
        mimeType: 'jpg',
        convertSize: 1000000,
        success: (compressedFile) => {
          this.accountForm.patchValue({
            avatarFile: compressedFile
          });
          reader.readAsDataURL(compressedFile);
          reader.onload = () => {
            //here the file can be showed (base 64 is on reader.result)
            this.avatarImage.nativeElement.src = reader.result;
            //need to run change detector since file load runs outside of zone
            this.changeDetector.markForCheck();
          };
        }
      });
    }
  }

}
