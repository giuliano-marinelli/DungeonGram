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
      error => iziToast.error({ message: 'There was an error, users can\'t be getted.' }),
      () => this.isLoading = false
    );
  }

  deleteUser(user: User): void {
    this.userService.deleteUser(user).subscribe(
      data => iziToast.success({ message: 'User deleted successfully.' }),
      error => iziToast.error({ message: 'There was an error, user can\'t be deleted.' }),
      () => this.getUsers()
    );
  }
}
