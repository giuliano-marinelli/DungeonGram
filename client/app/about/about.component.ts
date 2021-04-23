import { AfterViewChecked, ChangeDetectorRef, Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, NavigationEnd } from '@angular/router';
import { LoginComponent } from '../login/login.component';
import { RegisterComponent } from '../register/register.component';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {

  constructor(
    public router: Router,
    public auth: AuthService,
    private modalService: NgbModal
  ) { }

  openRegister() {
    this.modalService.open(RegisterComponent);
  }

  //scroll to the top of the document
  scrollToTop() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  }
}
