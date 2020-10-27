import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from '../../services/auth.service';
import { CampaignService } from '../../services/campaign.service';
import { Campaign } from '../../shared/models/campaign.model';
import { CampaignComponent } from '../campaign/campaign.component';

declare var $;
declare var iziToast;

@Component({
  selector: 'app-campaign-list',
  templateUrl: './campaign-list.component.html',
  styleUrls: ['./campaign-list.component.scss']
})
export class CampaignListComponent implements OnInit {

  ownCampaigns: Campaign[] = [];
  publicCampaigns: Campaign[] = [];
  isLoadingOwn = true;
  isLoadingPublic = true;

  constructor(
    public auth: AuthService,
    private campaignService: CampaignService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.getCampaigns();
  }

  getCampaigns(): void {
    this.campaignService.getCampaigns(true).subscribe(
      data => {
        this.ownCampaigns = data;
        setTimeout(() => {
          $('[data-toggle-tooltip="tooltip"]').tooltip({ html: true });
          $('[data-toggle-tooltip="tooltip"]').tooltip('hide');
        });
      },
      error => console.log(error),
      () => this.isLoadingOwn = false
    );
    this.campaignService.getCampaigns().subscribe(
      data => {
        this.publicCampaigns = data;
        setTimeout(() => {
          $('[data-toggle-tooltip="tooltip"]').tooltip({ html: true });
          $('[data-toggle-tooltip="tooltip"]').tooltip('hide');
        });
      },
      error => console.log(error),
      () => this.isLoadingPublic = false
    );
  }

  deleteCampaign(campaign: Campaign): void {
    var self = this;
    iziToast.question({
      timeout: false,
      close: false,
      overlay: true,
      displayMode: 'replace',
      zindex: 1051,
      color: 'red',
      icon: 'fa fa-trash',
      message: 'Are you sure to delete campaign <b>' + campaign.title + '</b>?',
      position: 'topCenter',
      buttons: [
        ['<button>Cancel</button>', function (instance, toast) {
          instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
        }, true],
        ['<button><b>Proceed</b></button>', function (instance, toast) {
          instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
          self.campaignService.deleteCampaign(campaign).subscribe(
            data => iziToast.success({ message: 'Campaign deleted successfully.' }),
            error => console.log(error),
            () => self.getCampaigns()
          );
        }]
      ]
    });
  }

  openCampaign(campaign?) {
    var modalRef = this.modalService.open(CampaignComponent);
    if (campaign) modalRef.componentInstance.campaign = campaign;
    modalRef.componentInstance.getCampaigns.subscribe(() => {
      this.getCampaigns();
    });
  }

}
