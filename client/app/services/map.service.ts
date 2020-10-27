import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Map } from '../shared/models/map.model';
import { Campaign } from '../shared/models/campaign.model';

@Injectable()
export class MapService {

  constructor(private http: HttpClient) { }

  getMaps(own?): Observable<Map[]> {
    return this.http.get<Map[]>('/api/maps', { params: { ...own ? { own: own } : {} } });
  }

  countMaps(): Observable<number> {
    return this.http.get<number>('/api/maps/count');
  }

  addMap(map: Map, campaign: Campaign): Observable<Map> {
    return this.http.post<Map>('/api/map', { map: map, campaign: campaign });
  }

  getMap(map: Map): Observable<Map> {
    return this.http.get<Map>(`/api/map/${map._id}`);
  }

  editMap(map: Map): Observable<any> {
    return this.http.put(`/api/map/${map._id}`, map, { responseType: 'text' });
  }

  deleteMap(map: Map): Observable<any> {
    return this.http.delete(`/api/map/${map._id}`, { responseType: 'text' });
  }
}
