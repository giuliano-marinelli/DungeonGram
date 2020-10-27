import { Component, Input, OnInit } from '@angular/core';
import { Controller } from '../shared/controller/controller';
import { CampaignService } from 'client/app/services/campaign.service';
import { Campaign } from 'client/app/shared/models/campaign.model';
import { Map } from 'client/app/shared/models/map.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MapComponent } from '../maps/map/map.component';
import { MapService } from '../services/map.service';

declare var $;
declare var iziToast;

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss']
})
export class ToolsComponent implements OnInit {
  @Input() controller: Controller;
  @Input() campaignId: any;

  tools: any;
  orderedTools: any[];

  campaign: Campaign;
  isLoadingCampaign = true;

  constructor(
    private campaignService: CampaignService,
    private mapService: MapService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    if (this.campaignId) this.getCampaign(); else this.isLoadingCampaign = false

    this.tools = {
      walls: {
        name: 'walls', label: 'Walls', image: 'assets/images/tools/walls.png', dropdown: true,
        options: {
          remove: true,
          adjustTo: 'grid',
          size: 'large',
          wallsVisibility: this.controller.initSetting("wallsVisibility", 0.5),
        },
        actions: {
          toggle: () => {
            this.toggleActiveTool(this.tools.walls, !this.tools.walls.active);
            this.controller.send('game', 'wall', { value: this.tools.walls.active, action: 'pickable' });
          },
          remove: (value) => { this.tools.walls.options.remove = value },
          adjustTo: (value) => { this.tools.walls.options.adjustTo = value },
          visibility: (visibility) => { this.controller.send('game', 'wall', { value: parseFloat(visibility.value), action: 'visibility' }) },
          size: (value) => { this.tools.walls.options.size = value }
        }
      },
      rule: {
        name: 'rule', label: 'Rule', image: 'assets/images/tools/rule.png', dropdown: true,
        options: {
          adjustTo: 'half_grid',
          normalizeUnit: true
        },
        actions: {
          toggle: () => { this.toggleActiveTool(this.tools.rule, !this.tools.rule.active) },
          adjustTo: (value) => { this.tools.rule.options.adjustTo = value },
          share: (share) => { this.controller.send('game', 'rule', { value: share, action: 'share' }) },
          normalizeUnit: (normalizeUnit) => { this.controller.send('game', 'rule', { value: normalizeUnit, action: 'normalizeUnit' }) },
        }
      },
      figure: {
        name: 'figure', label: 'Draw Figures', image: 'assets/images/tools/figure.png', dropdown: true,
        options: {
          adjustTo: 'half_grid',
          normalizeUnit: true
        },
        actions: {
          toggle: () => { this.toggleActiveTool(this.tools.figure, !this.tools.figure.active) },
          type: (type) => { this.controller.send('game', 'figure', { value: type, action: 'type' }) },
          adjustTo: (value) => { this.tools.figure.options.adjustTo = value },
          share: (share) => { this.controller.send('game', 'figure', { value: share, action: 'share' }) },
          normalizeUnit: (normalizeUnit) => { this.controller.send('game', 'figure', { value: normalizeUnit, action: 'normalizeUnit' }) },
        }
      },
      grid: {
        name: 'grid', label: 'Grid', image: 'assets/images/tools/grid.png', dropdown: true,
        options: {
          gridWidth: this.controller.initSetting("gridWidth", 20),
          gridHeight: this.controller.initSetting("gridHeight", 20),
          tilemapShowGrid: this.controller.initSetting("tilemapShowGrid", true),
        },
        actions: {
          gridSize: (size) => { this.controller.send('game', 'tilemap', { width: parseInt(size.width), height: parseInt(size.height), action: 'resize' }) },
          show: (show) => { this.controller.send('game', 'tilemap', { value: show, action: 'show' }) }
        }
      },
      fogOfWar: {
        name: 'fogOfWar', label: 'Fog of War', image: 'assets/images/tools/fogOfWar.png', dropdown: true,
        options: {
          fogOfWarVisibility: this.controller.initSetting("fogOfWarVisibility", 0),
        },
        actions: {
          visibility: (visibility) => { this.controller.send('game', 'fogOfWar', { value: parseFloat(visibility.value), action: 'visibility' }) },
        }
      },
      maps: {
        name: "maps", label: "Maps", image: 'assets/images/tools/maps.png', dropdown: true,
        options: {
          openedMap: this.controller.initSetting("openedMap", null)
        },
        actions: {
          open: (map) => {
            this.controller.send('game', 'map', { map: map._id, action: 'open' });
            // this.tools.maps.options.openedMap = this.tools.maps.options.openedMap != map._id ? map._id : null;
          },
          close: () => {
            this.controller.send('game', 'map', { action: 'close' });
            // this.tools.maps.options.openedMap = null;
          },
          discard: () => {
            this.controller.send('game', 'map', { action: 'discard' });
            // this.tools.maps.options.openedMap = null;
          },
        }
      }
    };

    this.orderedTools = [this.tools.maps, this.tools.grid, this.tools.walls, this.tools.fogOfWar, this.tools.rule, this.tools.figure];

    setTimeout(() => $('[data-toggle-tooltip="tooltip"]').tooltip({ html: true }));
  }

  callTool(event, tool) {
    if (this.tools[tool]?.actions?.toggle) this.tools[tool].actions.toggle();
    $('[data-toggle-tooltip="tooltip"]').tooltip('hide');
    event.stopPropagation(); //to stop dropdown work on click (only on hover)
  }

  toggleActiveTool(tool, toggle) {
    for (let toolKey in this.tools) {
      this.tools[toolKey].active = false;
    }
    tool.active = toggle;
    this.controller.toggleTool(tool, toggle);
  }

  getCampaign(): void {
    this.campaignService.getCampaignById(this.campaignId).subscribe(
      data => {
        this.campaign = data;
        setTimeout(() => {
          $('[data-toggle-tooltip="tooltip"]').tooltip({ html: true });
          $('[data-toggle-tooltip="tooltip"]').tooltip('hide');
        });
      },
      error => console.log(error),
      () => {
        if (this.campaign != null)
          this.isLoadingCampaign = false;
      }
    );
  }

  openMap(map?) {
    if (this.campaign) {
      var modalRef = this.modalService.open(MapComponent);
      if (map) modalRef.componentInstance.map = map;
      modalRef.componentInstance.campaign = this.campaign;
      modalRef.componentInstance.getMaps.subscribe(() => {
        this.getCampaign();
      });
    }
  }

  deleteMap(map: Map) {
    var self = this;
    iziToast.question({
      timeout: false,
      close: false,
      overlay: true,
      displayMode: 'replace',
      zindex: 1051,
      color: 'red',
      icon: 'fa fa-trash',
      message: 'Are you sure to delete map <b>' + map.name + '</b>?',
      position: 'topCenter',
      buttons: [
        ['<button>Cancel</button>', function (instance, toast) {
          instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
        }, true],
        ['<button><b>Proceed</b></button>', function (instance, toast) {
          instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
          self.mapService.deleteMap(map).subscribe(
            data => iziToast.success({ message: 'Map deleted successfully.' }),
            error => console.log(error),
            () => {
              self.getCampaign();
              self.tools.maps.actions.discard();
            }
          );
        }]
      ]
    });
  }
}
