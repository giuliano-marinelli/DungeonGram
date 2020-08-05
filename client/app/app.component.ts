import { AfterViewChecked, ChangeDetectorRef, Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LoginComponent } from './login/login.component';
import { Router, NavigationEnd } from '@angular/router';
import { RegisterComponent } from './register/register.component';

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

}
