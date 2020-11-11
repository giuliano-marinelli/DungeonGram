import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MapService } from 'client/app/services/map.service';
import { AuthService } from 'client/app/services/auth.service';
import { Map } from 'client/app/shared/models/map.model';
import { Campaign } from 'client/app/shared/models/campaign.model';

declare var iziToast;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  @Input() public map: Map;
  @Input() public campaign: Campaign;
  @Output("getMaps") getMaps: EventEmitter<any> = new EventEmitter();

  isLoading = true;
  mapForm: FormGroup;
  _id;
  owner;
  name = new FormControl('', [
    Validators.required,
    Validators.minLength(1),
    Validators.maxLength(50)
  ]);
  description = new FormControl('', [
    Validators.minLength(0),
    Validators.maxLength(150)
  ]);
  imageUrl = new FormControl('', [
    Validators.minLength(0),
    Validators.maxLength(10000)
  ]);
  private = new FormControl(false, []);
  walls = new FormControl([], []);
  characters = new FormControl([], []);
  tilemap = new FormControl('', []);

  constructor(
    private formBuilder: FormBuilder,
    public auth: AuthService,
    private mapService: MapService,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.mapForm = this.formBuilder.group({
      _id: this._id,
      owner: this.owner,
      name: this.name,
      description: this.description,
      walls: this.walls,
      characters: this.characters,
      tilemap: this.tilemap,
      imageUrl: this.imageUrl,
      private: this.private
    });
    if (this.map) this.getMap(); else this.isLoading = false
  }

  setValid(control): object {
    return {
      'is-invalid': this[control].touched && !this[control].valid,
      'is-valid': this[control].touched && this[control].valid
    };
  }

  getMap(): void {
    this.mapService.getMap(this.map).subscribe(
      data => this.mapForm.patchValue(data),
      error => console.log(error),
      () => this.isLoading = false
    );
  }

  saveMap(): void {
    this.mapForm.markAllAsTouched();
    if (this.mapForm.valid) {
      if (!this.map) {
        this.mapService.addMap(this.mapForm.value, this.campaign).subscribe(
          res => {
            iziToast.success({ message: 'Map created correctly.' });
            // this.router.navigate(['/login']);
            this.getMaps.emit();
            this.modalService.dismissAll();
          },
          error => iziToast.error({ message: 'There was an error, map can\'t be created.' })
        );
      } else {
        this.mapService.editMap(this.mapForm.value).subscribe(
          res => {
            iziToast.success({ message: 'Map was changed correctly.' });
            // this.router.navigate(['/login']);
            this.getMaps.emit();
            this.modalService.dismissAll();
          },
          error => iziToast.error({ message: 'There was an error, map can\'t be changed.' })
        );
      }
    } else {
      iziToast.error({ message: 'Some values are invalid, please check.' });
    }
  }
}
