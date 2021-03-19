import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Campaign } from '../shared/models/campaign.model';

@Injectable()
export class CampaignService {

  constructor(private http: HttpClient) { }

  getCampaigns(own?, page?, count?): Observable<Campaign[]> {
    return this.http.get<Campaign[]>('/api/campaigns',
      { params: { ...own ? { own: own } : {}, ...page ? { page: page } : {}, ...count ? { count: count } : {} } }
    );
  }

  countCampaigns(own?): Observable<number> {
    return this.http.get<number>('/api/campaigns/count', { params: { ...own ? { own: own } : {} } });
  }

  addCampaign(campaign: Campaign): Observable<Campaign> {
    return this.http.post<Campaign>('/api/campaign', campaign);
  }

  getCampaign(campaign: Campaign): Observable<Campaign> {
    return this.http.get<Campaign>(`/api/campaign/${campaign._id}`);
  }

  getCampaignById(id: string): Observable<Campaign> {
    return this.http.get<Campaign>(`/api/campaign/${id}`);
  }

  editCampaign(campaign: Campaign): Observable<any> {
    return this.http.put(`/api/campaign/${campaign._id}`, campaign, { responseType: 'text' });
  }

  deleteCampaign(campaign: Campaign): Observable<any> {
    return this.http.delete(`/api/campaign/${campaign._id}`, { responseType: 'text' });
  }
}
