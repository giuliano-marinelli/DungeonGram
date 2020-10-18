import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Campaign } from '../shared/models/campaign.model';

@Injectable()
export class CampaignService {

  constructor(private http: HttpClient) { }

  getCampaigns(own?): Observable<Campaign[]> {
    return this.http.get<Campaign[]>('/api/campaigns', { params: { ...own ? { own: own } : {} } });
  }

  countCampaigns(): Observable<number> {
    return this.http.get<number>('/api/campaigns/count');
  }

  addCampaign(campaign: Campaign): Observable<Campaign> {
    return this.http.post<Campaign>('/api/campaign', campaign);
  }

  getCampaign(campaign: Campaign): Observable<Campaign> {
    return this.http.get<Campaign>(`/api/campaign/${campaign._id}`);
  }

  editCampaign(campaign: Campaign): Observable<any> {
    return this.http.put(`/api/campaign/${campaign._id}`, campaign, { responseType: 'text' });
  }

  deleteCampaign(campaign: Campaign): Observable<any> {
    return this.http.delete(`/api/campaign/${campaign._id}`, { responseType: 'text' });
  }
}
