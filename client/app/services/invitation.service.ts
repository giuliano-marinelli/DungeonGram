import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Invitation } from '../shared/models/invitation.model';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {

  constructor(private http: HttpClient) { }

  getInvitations(params?): Observable<Invitation[]> {
    return this.http.get<Invitation[]>('/api/invitations', { params: params });
  }

  countInvitations(params?): Observable<number> {
    return this.http.get<number>('/api/invitations/count', { params: params });
  }

  addInvitation(invitation: Invitation): Observable<Invitation> {
    return this.http.post<Invitation>('/api/invitation', invitation);
  }

  getInvitation(invitation: Invitation): Observable<Invitation> {
    return this.http.get<Invitation>(`/api/invitation/${invitation._id}`);
  }

  editInvitation(invitation: Invitation): Observable<any> {
    return this.http.put(`/api/invitation/${invitation._id}`, invitation, { responseType: 'text' });
  }

  deleteInvitation(invitation: Invitation): Observable<any> {
    return this.http.delete(`/api/invitation/${invitation._id}`, { responseType: 'text' });
  }
}
