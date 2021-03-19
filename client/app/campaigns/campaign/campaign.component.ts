import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CampaignService } from 'client/app/services/campaign.service';
import { AuthService } from 'client/app/services/auth.service';
import { Campaign } from 'client/app/shared/models/campaign.model';

declare var iziToast;

@Component({
  selector: 'app-campaign',
  templateUrl: './campaign.component.html',
  styleUrls: ['./campaign.component.scss']
})
export class CampaignComponent implements OnInit {

  @Input() public campaign: Campaign;
  @Output("getCampaigns") getCampaigns: EventEmitter<any> = new EventEmitter();

  isLoading = true;
  campaignForm: FormGroup;
  _id;
  // owner;
  title = new FormControl('', [
    Validators.required,
    Validators.minLength(1),
    Validators.maxLength(50)
  ]);
  description = new FormControl('', [
    Validators.minLength(0),
    Validators.maxLength(200)
  ]);
  private = new FormControl(false, []);
  // players = new FormControl([], []);
  // maps = new FormControl([], []);

  constructor(
    private formBuilder: FormBuilder,
    public auth: AuthService,
    private campaignService: CampaignService,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.campaignForm = this.formBuilder.group({
      _id: this._id,
      // owner: this.owner,
      title: this.title,
      description: this.description,
      // players: this.players,
      // maps: this.maps,
      private: this.private
    });
    if (this.campaign) this.getCampaign(); else this.isLoading = false
  }

  setValid(control): object {
    return {
      'is-invalid': this[control].touched && !this[control].valid,
      'is-valid': this[control].touched && this[control].valid
    };
  }

  getCampaign(): void {
    this.campaignService.getCampaign(this.campaign).subscribe(
      data => this.campaignForm.patchValue(data),
      error => console.log(error),
      () => this.isLoading = false
    );
  }

  saveCampaign(): void {
    this.campaignForm.markAllAsTouched();
    if (this.campaignForm.valid) {
      if (!this.campaign) {
        this.campaignService.addCampaign(this.campaignForm.value).subscribe(
          res => {
            iziToast.success({ message: 'Campaign created correctly, now you can invite your friends!' });
            // this.router.navigate(['/login']);
            this.getCampaigns.emit();
            this.modalService.dismissAll();
          },
          error => iziToast.error({ message: 'There was an error, campaign can\'t be created.' })
        );
      } else {
        this.campaignService.editCampaign(this.campaignForm.value).subscribe(
          res => {
            iziToast.success({ message: 'Campaign was changed correctly.' });
            // this.router.navigate(['/login']);
            this.getCampaigns.emit();
            this.modalService.dismissAll();
          },
          error => iziToast.error({ message: 'There was an error, campaign can\'t be changed.' })
        );
      }
    } else {
      iziToast.error({ message: 'Some values are invalid, please check.' });
    }
  }
}