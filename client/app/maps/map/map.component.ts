import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MapService } from 'client/app/services/map.service';
import { AuthService } from 'client/app/services/auth.service';
import { Map } from 'client/app/shared/models/map.model';
import { Campaign } from 'client/app/shared/models/campaign.model';
import Compressor from 'compressorjs';

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
  @ViewChild("terrain_img") terrainImage: ElementRef;

  isLoading = true;

  //form
  formSended: boolean = false;
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
  // walls = new FormControl([], []);
  // tilemap = new FormControl('', []);
  terrain = new FormControl('', []);
  terrainFile = new FormControl('', []);

  constructor(
    private formBuilder: FormBuilder,
    public auth: AuthService,
    private mapService: MapService,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private changeDetector: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.mapForm = this.formBuilder.group({
      _id: this._id,
      owner: this.owner,
      name: this.name,
      description: this.description,
      // walls: this.walls,
      // tilemap: this.tilemap,
      imageUrl: this.imageUrl,
      private: this.private,
      terrain: this.terrain,
      terrainFile: this.terrainFile
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
      this.formSended = true;
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

  onChangeTerrain(files: File[]): void {
    const reader = new FileReader();
    if (files && files.length) {
      const [file] = files;
      new Compressor(file, {
        quality: 0.2,
        mimeType: 'jpg',
        convertSize: 1000000,
        success: (compressedFile) => {
          this.mapForm.patchValue({
            terrainFile: compressedFile
          });
          reader.readAsDataURL(compressedFile);
          reader.onload = () => {
            //here the file can be showed (base 64 is on reader.result)
            this.terrainImage.nativeElement.src = reader.result;
            //need to run change detector since file load runs outside of zone
            this.changeDetector.markForCheck();
          };
        }
      });
    }
  }
}
