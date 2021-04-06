import { Component, OnInit } from '@angular/core';

import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { User } from '../shared/models/user.model';

declare var iziToast;
@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  pageUsers: number = 1;
  pageSizeUsers: number = 10;
  _countUsers: number = 0;

  users: User[] = [];
  isLoading = true;

  constructor(
    public auth: AuthService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.getUsers();
  }

  countUsers(): void {
    this.userService.countUsers().subscribe(
      data => this._countUsers = data,
      error => iziToast.error({ message: 'There was an error, users can\'t be counted.' })
    );
  }

  getUsers(): void {
    this.countUsers();
    this.userService.getUsers({
      page: this.pageUsers,
      count: this.pageSizeUsers
    }).subscribe(
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
