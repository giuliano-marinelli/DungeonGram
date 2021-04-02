import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Map } from '../shared/models/map.model';
import { Campaign } from '../shared/models/campaign.model';
import { GlobalComponent } from '../shared/global/global.component';

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
    var formData = GlobalComponent.createFormData(map);
    formData.append('campaign', campaign._id);
    return this.http.post<Map>('/api/map', formData);
  }

  getMap(map: Map): Observable<Map> {
    return this.http.get<Map>(`/api/map/${map._id}`);
  }

  editMap(map: Map): Observable<any> {
    return this.http.post(`/api/map/${map._id}`, GlobalComponent.createFormData(map), { responseType: 'text' });
  }

  deleteMap(map: Map): Observable<any> {
    return this.http.delete(`/api/map/${map._id}`, { responseType: 'text' });
  }
}
