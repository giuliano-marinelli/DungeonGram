import { Component, OnInit } from '@angular/core';

import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { User } from '../shared/models/user.model';

declare var iziToast;
@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {

  users: User[] = [];
  isLoading = true;

  constructor(
    public auth: AuthService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.getUsers();
  }

  getUsers(): void {
    this.userService.getUsers().subscribe(
      data => this.users = data,
      error => console.log(error),
      () => this.isLoading = false
    );
  }

  deleteUser(user: User): void {
    var self = this;
    iziToast.question({
      timeout: false,
      close: false,
      overlay: true,
      displayMode: 'replace',
      zindex: 1051,
      color: 'red',
      icon: 'fa fa-trash',
      message: 'Are you sure to delete <b>' + user.username + '</b>?',
      position: 'topCenter',
      buttons: [
        ['<button>Cancel</button>', function (instance, toast) {
          instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
        }, true],
        ['<button><b>Proceed</b></button>', function (instance, toast) {
          instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
          self.userService.deleteUser(user).subscribe(
            data => iziToast.success({ message: 'User deleted successfully.' }),
            error => console.log(error),
            () => self.getUsers()
          );
        }]
      ]
    });
  }

}
