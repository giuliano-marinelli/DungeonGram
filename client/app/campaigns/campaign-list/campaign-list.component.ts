import { Component, OnInit } from '@angular/core';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

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

  pageOwnCampaigns: number = 1;
  pagePublicCampaigns: number = 1;
  pageSizeOwnCampaigns: number = 10;
  pageSizePublicCampaigns: number = 10;
  countOwnCampaigns: number = 0;
  countPublicCampaigns: number = 0;

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
    this.countCampaigns();
    this.getCampaigns(true);
    this.getCampaigns(false);
  }

  countCampaigns(): void {
    this.campaignService.countCampaigns(true).subscribe(
      data => this.countOwnCampaigns = data,
      error => console.log(error)
    );
    this.campaignService.countCampaigns(false).subscribe(
      data => this.countPublicCampaigns = data,
      error => console.log(error)
    );
  }

  setPage(own, page): void {
    if (own) this.pageOwnCampaigns = page;
    else this.pagePublicCampaigns = page;

    this.countCampaigns();
    this.getCampaigns(own);
  }

  getCampaigns(own): void {
    this.campaignService.getCampaigns(
      own, own ? this.pageOwnCampaigns : this.pagePublicCampaigns, own ? this.pageSizeOwnCampaigns : this.pageSizePublicCampaigns
    ).subscribe(
      data => {
        if (own) this.ownCampaigns = data
        else this.publicCampaigns = data
        setTimeout(() => {
          $('[data-toggle-tooltip="tooltip"]').tooltip({ html: true });
          $('[data-toggle-tooltip="tooltip"]').tooltip('hide');
        });
      },
      error => console.log(error),
      () => {
        if (own) this.isLoadingOwn = false
        else this.isLoadingPublic = false
      }
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
            () => {
              self.countCampaigns();
              self.getCampaigns(true);
              self.getCampaigns(false)
            }
          );
        }]
      ]
    });
  }

  openCampaign(campaign?) {
    var modalRef = this.modalService.open(CampaignComponent);
    if (campaign) modalRef.componentInstance.campaign = campaign;
    modalRef.componentInstance.getCampaigns.subscribe(() => {
      this.countCampaigns();
      this.getCampaigns(true);
      this.getCampaigns(false);
    });
  }

}