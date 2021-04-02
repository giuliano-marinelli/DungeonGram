import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { User } from '../shared/models/user.model';
import { GlobalComponent } from '../shared/global/global.component';

@Injectable()
export class UserService {

  constructor(private http: HttpClient) { }

  register(user: User): Observable<User> {
    return this.http.post<User>('/api/user', user);
  }

  login(credentials): Observable<any> {
    return this.http.post('/api/login', credentials);
  }

  getUsers(params?): Observable<User[]> {
    return this.http.get<User[]>('/api/users', { params: params });
  }

  countUsers(params?): Observable<number> {
    return this.http.get<number>('/api/users/count', { params: params });
  }

  addUser(user: User): Observable<User> {
    return this.http.post<User>('/api/user', GlobalComponent.createFormData(user));
  }

  getUser(user: User): Observable<User> {
    return this.http.get<User>(`/api/user/${user._id}`);
  }

  editUser(user: User): Observable<any> {
    return this.http.post(`/api/user/${user._id}`, GlobalComponent.createFormData(user), { responseType: 'text' });
  }

  deleteUser(user: User): Observable<any> {
    return this.http.delete(`/api/user/${user._id}`, { responseType: 'text' });
  }

}
