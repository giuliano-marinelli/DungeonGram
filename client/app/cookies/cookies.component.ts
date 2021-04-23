import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cookies',
  templateUrl: './cookies.component.html',
  styleUrls: ['./cookies.component.scss']
})
export class CookiesComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  //scroll to the top of the document
  scrollToTop() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  }

}
