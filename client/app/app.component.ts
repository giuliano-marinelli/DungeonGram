import { AfterViewChecked, ChangeDetectorRef, Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LoginComponent } from './login/login.component';
import { Router, NavigationEnd } from '@angular/router';
import { RegisterComponent } from './register/register.component';

declare var iziToast;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewChecked {
  constructor(
    public router: Router,
    public auth: AuthService,
    private changeDetector: ChangeDetectorRef,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    iziToast.settings({
      position: 'topRight'
      // maxWidth: '30%'
    });
  }

  ngAfterViewChecked(): void {
    this.changeDetector.detectChanges();
  }

  openLogin() {
    this.modalService.open(LoginComponent);
  }

  openRegister() {
    this.modalService.open(RegisterComponent);
  }

  logout() {
    var self = this;
    iziToast.question({
      timeout: false,
      close: false,
      overlay: true,
      displayMode: 'replace',
      zindex: 1051,
      theme: 'dark',
      icon: 'fa fa-user',
      color: 'grey',
      message: 'Are you sure want to logout?',
      position: 'topCenter',
      buttons: [
        ['<button>Cancel</button>', function (instance, toast) {
          instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
        }, true],
        ['<button><b>Proceed</b></button>', function (instance, toast) {
          instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
          self.auth.logout();
        }]
      ]
    });
  }

  isActive(url: string): boolean {
    return this.router.isActive(url, false);
  }

}
