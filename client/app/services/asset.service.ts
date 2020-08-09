import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AssetService {

  constructor(private http: HttpClient) { }

  getAssets(): Observable<[]> {
    return this.http.get<[]>('/api/assets');
  }

}
