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

  searchOwnCampaigns: string = '';
  searchPublicCampaigns: string = '';

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

  deleteSended: Campaign[] = [];
  leaveSended: Campaign[] = [];
  acceptSended: Campaign[] = [];
  deniedSended: Campaign[] = [];

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
    this.campaignService.countCampaigns({
      search: own ? this.searchOwnCampaigns : this.searchPublicCampaigns,
      own: own
    }).subscribe(
      data => {
        if (own) this.countOwnCampaigns = data
        else this.countPublicCampaigns = data
      },
      error => iziToast.error({ message: 'There was an error, campaigns can\'t be counted.' })
    );
  }

  getCampaigns(own: boolean): void {
    if (this.auth.loggedIn || !own) {
      this.countCampaigns(own);
      this.campaignService.getCampaigns(
        {
          search: own ? this.searchOwnCampaigns : this.searchPublicCampaigns,
          own: own,
          page: own ? this.pageOwnCampaigns : this.pagePublicCampaigns,
          count: own ? this.pageSizeOwnCampaigns : this.pageSizePublicCampaigns
        }
      ).subscribe(
        data => {
          if (own) this.ownCampaigns = data
          else this.publicCampaigns = data
        },
        error => iziToast.error({ message: 'There was an error, campaigns can\'t be getted.' }),
        () => {
          if (own) this.isLoadingOwn = false
          else this.isLoadingPublic = false
        }
      );
    }
  }

  deleteCampaign(campaign: Campaign): void {
    this.deleteSended.push(campaign);
    this.campaignService.deleteCampaign(campaign).subscribe(
      data => iziToast.success({ message: 'Campaign deleted successfully.' }),
      error => iziToast.error({ message: 'There was an error, campaign can\'t be deleted.' }),
      () => {
        this.getCampaigns(true);
        this.getCampaigns(false)
      }
    );
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
    this.acceptSended.push(campaign);
    var invitation = this.getInvitation(campaign);
    invitation.accepted = true;
    this.invitationService.editInvitation(invitation).subscribe(
      data => iziToast.success({ message: 'Invitation accepted' }),
      error => iziToast.error({ message: 'There was an error, invitation can\'t be accepted.' }),
      () => {
        this.getCampaigns(true);
        this.getCampaigns(false);
      }
    );
  }

  deniedInvitation(campaign: Campaign): void {
    this.deniedSended.push(campaign);
    var invitation = this.getInvitation(campaign);
    invitation.accepted = false;
    this.invitationService.editInvitation(invitation).subscribe(
      data => iziToast.success({ message: 'Invitation denied' }),
      error => iziToast.error({ message: 'There was an error, invitation can\'t be denied.' }),
      () => {
        this.getCampaigns(true);
        this.getCampaigns(false);
      }
    );
  }

  leaveInvitation(campaign: Campaign): void {
    this.leaveSended.push(campaign);
    var invitation = this.getInvitation(campaign);
    invitation.accepted = false;
    this.invitationService.editInvitation(invitation).subscribe(
      data => iziToast.success({ message: 'You leaved the campaign successfully.' }),
      error => iziToast.error({ message: 'There was an error, you can\'t leave the campaign.' }),
      () => {
        this.getCampaigns(true);
        this.getCampaigns(false);
      }
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
