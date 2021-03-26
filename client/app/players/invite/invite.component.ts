import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'client/app/services/auth.service';

import { UserService } from 'client/app/services/user.service';
import { User } from 'client/app/shared/models/user.model';
import { CampaignService } from 'client/app/services/campaign.service';
import { Campaign } from 'client/app/shared/models/campaign.model';
import { InvitationService } from 'client/app/services/invitation.service';
import { Invitation } from 'client/app/shared/models/invitation.model';

declare var $;
declare var iziToast;

@Component({
  selector: 'app-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.scss']
})
export class InviteComponent implements OnInit, OnDestroy {

  @Input() public campaign: Campaign;
  @Output("getCampaigns") getCampaigns: EventEmitter<any> = new EventEmitter();

  pagePlayers: number = 1;
  pageSizePlayers: number = 6;
  _countPlayers: number = 0;

  players: User[] = [];
  isLoadingPlayers = true;

  isLoadingCampaign = true;

  invitations: Invitation[] = [];

  inviteForm: FormGroup;
  searchPlayers = new FormControl('', []);

  constructor(
    private formBuilder: FormBuilder,
    public auth: AuthService,
    private userService: UserService,
    private campaignService: CampaignService,
    private invitationService: InvitationService,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.inviteForm = this.formBuilder.group({
      searchPlayers: this.searchPlayers
    });
    if (this.campaign) this.isLoadingCampaign = false;
    this.getPlayers();
    this.getInvitations();
  }

  ngOnDestroy(): void {
    this.getCampaigns.emit();
  }

  countPlayers(): void {
    this.userService.countUsers({ search: this.searchPlayers.value }).subscribe(
      data => this._countPlayers = data,
      error => console.log(error)
    );
  }

  setPage(page): void {
    this.pagePlayers = page;

    this.getPlayers();
  }

  getPlayers(): void {
    this.countPlayers();
    this.isLoadingPlayers = true;
    this.userService.getUsers(
      {
        search: this.searchPlayers.value,
        page: this.pagePlayers,
        count: this.pageSizePlayers
      }
    ).subscribe(
      data => {
        this.players = data;
        setTimeout(() => {
          $('[data-toggle-tooltip="tooltip"]').tooltip({ html: true });
          $('[data-toggle-tooltip="tooltip"]').tooltip('hide');
        });
      },
      error => console.log(error),
      () => this.isLoadingPlayers = false
    );
  }

  getInvitations(): void {
    this.invitationService.getInvitations({ campaign: this.campaign._id }).subscribe(
      data => {
        this.invitations = data;
      },
      error => console.log(error)
    );
  }

  sendInvitation(player: User): void {
    var invitation = new Invitation();
    invitation.recipient = player._id;
    invitation.campaign = this.campaign._id;
    this.invitationService.addInvitation(invitation).subscribe(
      res => {
        iziToast.success({ message: 'Invitation sended correctly' });
        $('[data-toggle-tooltip="tooltip"]').tooltip('hide');
        this.getPlayers();
        this.getInvitations();
      },
      error => iziToast.error({ message: 'There was an error, invitation can\'t be sended.' })
    );
  }

  cancelInvitation(player: User): void {
    var invitation = this.getInvitation(player);
    this.invitationService.deleteInvitation(invitation).subscribe(
      res => {
        iziToast.success({ message: 'Invitation canceled correctly' });
        $('[data-toggle-tooltip="tooltip"]').tooltip('hide');
        this.getPlayers();
        this.getInvitations();
      },
      error => iziToast.error({ message: 'There was an error, invitation can\'t be canceled.' })
    );
  }

  getInvitation(player: User): Invitation {
    return this.invitations.find(invitation => invitation.recipient == player._id);
  }
}
