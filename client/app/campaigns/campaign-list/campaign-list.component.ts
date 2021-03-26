import { Component, OnInit } from '@angular/core';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from '../../services/auth.service';
import { CampaignService } from '../../services/campaign.service';
import { Campaign } from '../../shared/models/campaign.model';
import { CampaignComponent } from '../campaign/campaign.component';
import { InvitationService } from 'client/app/services/invitation.service';
import { Invitation } from 'client/app/shared/models/invitation.model';
import { InviteComponent } from '../../players/invite/invite.component';

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
    private invitationService: InvitationService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.getCampaigns(true);
    this.getCampaigns(false);
  }

  countCampaigns(own: boolean): void {
    this.campaignService.countCampaigns({ own: own }).subscribe(
      data => {
        if (own) this.countOwnCampaigns = data
        else this.countPublicCampaigns = data
      },
      error => console.log(error)
    );
  }

  setPage(own: boolean, page: number): void {
    if (own) this.pageOwnCampaigns = page;
    else this.pagePublicCampaigns = page;

    this.getCampaigns(own);
  }

  getCampaigns(own: boolean): void {
    if (this.auth.loggedIn || !own) {
      this.countCampaigns(own);
      this.campaignService.getCampaigns(
        {
          own: own,
          page: own ? this.pageOwnCampaigns : this.pagePublicCampaigns,
          count: own ? this.pageSizeOwnCampaigns : this.pageSizePublicCampaigns
        }
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
              self.getCampaigns(true);
              self.getCampaigns(false)
            }
          );
        }]
      ]
    });
  }

  openCampaign(campaign?: Campaign): void {
    var modalRef = this.modalService.open(CampaignComponent);
    if (campaign) modalRef.componentInstance.campaign = campaign;
    modalRef.componentInstance.getCampaigns.subscribe(() => {
      this.getCampaigns(true);
      this.getCampaigns(false);
    });
  }

  openInvite(campaign?: Campaign): void {
    var modalRef = this.modalService.open(InviteComponent, { size: 'lg' });
    if (campaign) modalRef.componentInstance.campaign = campaign;
    modalRef.componentInstance.getCampaigns.subscribe(() => {
      this.getCampaigns(true);
      this.getCampaigns(false);
    });
  }

  acceptInvitation(campaign: Campaign): void {
    var invitation = this.getInvitation(campaign);
    invitation.accepted = true;
    this.invitationService.editInvitation(invitation).subscribe(
      res => {
        iziToast.success({ message: 'Invitation accepted' });
        $('[data-toggle-tooltip="tooltip"]').tooltip('hide');
        this.getCampaigns(true);
        this.getCampaigns(false);
      },
      error => iziToast.error({ message: 'There was an error, invitation can\'t be accepted.' })
    );
  }

  deniedInvitation(campaign: Campaign): void {
    var invitation = this.getInvitation(campaign);
    invitation.accepted = false;
    this.invitationService.editInvitation(invitation).subscribe(
      res => {
        iziToast.success({ message: 'Invitation accepted' });
        $('[data-toggle-tooltip="tooltip"]').tooltip('hide');
        this.getCampaigns(true);
        this.getCampaigns(false);
      },
      error => iziToast.error({ message: 'There was an error, invitation can\'t be accepted.' })
    );
  }

  getInvitation(campaign: Campaign): Invitation {
    if (this.auth.loggedIn) return campaign["invitations"]?.find(invitation => invitation.recipient == this.auth.currentUser._id);
    else return null;
  }

  getPlayers(campaign: Campaign): string[] {
    return campaign["invitations"]?.filter(invitation => invitation.accepted).map(invitation => invitation.recipient_info?.username);
  }
}
