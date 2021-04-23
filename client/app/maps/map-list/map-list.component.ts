import { Component, OnInit } from '@angular/core';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from '../../services/auth.service';
import { MapService } from '../../services/map.service';
import { Map } from '../../shared/models/map.model';
import { MapComponent } from '../map/map.component';

declare var $;
declare var iziToast;

@Component({
  selector: 'app-map-list',
  templateUrl: './map-list.component.html',
  styleUrls: ['./map-list.component.scss']
})
export class MapListComponent implements OnInit {

  searchOwnMaps: string = '';
  searchPublicMaps: string = '';

  pageOwnMaps: number = 1;
  pagePublicMaps: number = 1;
  pageSizeOwnMaps: number = 10;
  pageSizePublicMaps: number = 10;
  countOwnMaps: number = 0;
  countPublicMaps: number = 0;

  ownMaps: Map[] = [];
  publicMaps: Map[] = [];
  isLoadingOwn: boolean = true;
  isLoadingPublic: boolean = true;

  constructor(
    public auth: AuthService,
    private mapService: MapService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.getMaps(true);
    this.getMaps(false);
  }

  countMaps(own: boolean): void {
    this.mapService.countMaps({
      search: own ? this.searchOwnMaps : this.searchPublicMaps,
      own: own
    }).subscribe(
      data => {
        if (own) this.countOwnMaps = data
        else this.countPublicMaps = data
      },
      error => iziToast.error({ message: 'There was an error, maps can\'t be counted.' })
    );
  }

  getMaps(own: boolean): void {
    if (this.auth.loggedIn || !own) {
      this.countMaps(own);
      this.mapService.getMaps(
        {
          search: own ? this.searchOwnMaps : this.searchPublicMaps,
          own: own,
          page: own ? this.pageOwnMaps : this.pagePublicMaps,
          count: own ? this.pageSizeOwnMaps : this.pageSizePublicMaps
        }
      ).subscribe(
        data => {
          if (own) this.ownMaps = data
          else this.publicMaps = data
        },
        error => iziToast.error({ message: 'There was an error, maps can\'t be getted.' }),
        () => {
          if (own) this.isLoadingOwn = false
          else this.isLoadingPublic = false
        }
      );
    }
  }

  deleteMap(map: Map): void {
    this.mapService.deleteMap(map).subscribe(
      data => iziToast.success({ message: 'Map deleted successfully.' }),
      error => iziToast.error({ message: 'There was an error, map can\'t be deleted.' }),
      () => {
        this.getMaps(true);
        this.getMaps(false)
      }
    );
  }

  openMap(map?) {
    var modalRef = this.modalService.open(MapComponent);
    if (map) modalRef.componentInstance.map = map;
    modalRef.componentInstance.getMaps.subscribe(() => {
      this.getMaps(true);
      this.getMaps(false);
    });
  }

}
