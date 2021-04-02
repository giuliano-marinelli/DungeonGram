import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Controller } from '../shared/controller/controller';
import { Campaign } from 'client/app/shared/models/campaign.model';
import { CampaignService } from 'client/app/services/campaign.service';
import { Map } from 'client/app/shared/models/map.model';
import { MapService } from '../services/map.service';
import { MapComponent } from '../maps/map/map.component';
import { Character } from 'client/app/shared/models/character.model';
import { CharacterService } from 'client/app/services/character.service';
import { CharacterComponent } from '../characters/character/character.component';

declare var $;
declare var iziToast;
declare var Object;

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

  pageOwnCharacters: number = 1;
  pagePublicCharacters: number = 1;
  pageSizeOwnCharacters: number = 4;
  pageSizePublicCharacters: number = 4;
  countOwnCharacters: number = 0;
  countPublicCharacters: number = 0;

  ownCharacters: Character[] = [];
  publicCharacters: Character[] = [];
  isLoadingOwnCharacters: boolean = true;
  isLoadingPublicCharacters: boolean = true;

  openedMap: Map;
  isLoadingOpenedMap: boolean = true;

  selectedMap: Map;

  ObjectValues = Object.values; //for get values of object

  constructor(
    private campaignService: CampaignService,
    private mapService: MapService,
    private characterService: CharacterService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    if (this.campaignId) this.getCampaign(); else this.isLoadingCampaign = false;
    this.getCharacters(true);
    this.getCharacters(false);

    this.tools = {
      users: {
        options: {
          isDM: this.controller.initSetting("isDM", false)
        }
      },
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
          fogOfWarVisibilityPlayers: this.controller.initSetting("fogOfWarVisibilityPlayers", 0),
        },
        actions: {
          visibility: (visibility) => { this.controller.send('game', 'fogOfWar', { value: parseFloat(visibility.value), action: 'visibility' }) },
          visibilityPlayers: (visibilityPlayers) => { this.controller.send('game', 'fogOfWar', { value: parseFloat(visibilityPlayers.value), action: 'visibilityPlayers' }) },
        }
      },
      maps: {
        name: "maps", label: "Maps", image: 'assets/images/tools/maps.png', dropdown: true,
        options: {
          openedMap: this.controller.initSetting("openedMap", null, (value) => {
            this.tools.characters.options.selectedMap = value || null;
          }),
        },
        actions: {
          open: (map) => {
            this.controller.send('game', 'map', { map: map._id, action: 'open' });
          },
          close: () => {
            this.controller.send('game', 'map', { action: 'close' });
          },
          discard: () => {
            this.controller.send('game', 'map', { action: 'discard' });
          },
          updateTilemap: () => {
            console.log('update tilemap is called');
            this.controller.send('game', 'map', { action: 'updateTilemap' });
          },
          update: () => {
            this.controller.send('game', 'map', { action: 'update' });
          }
        }
      },
      characters: {
        name: "characters", label: "Characters", image: 'assets/images/tools/characters.png', dropdown: true,
        options: {
          charactersOnCampaign: this.controller.initSetting("charactersOnCampaign", null),
          addingMode: this.controller.initSetting("addingMode", false),
          selectedCharacter: this.controller.initSetting("selectedCharacter", null),
          selectedCharacterObj: this.controller.initSetting("selectedCharacterObj", null),
          addingModeModel: this.controller.initSetting("addingModeModel", null),
          selectedMap: null //map is selected when openedMap setting change on maps tool options
        },
        actions: {
          addingMode: (character) => {
            this.controller.send('game', 'character', { model: character._id, action: 'addingModeOn' });
          },
          select: (character) => {
            this.controller.send('game', 'character', { id: character.id, action: 'select' });
          },
          remove: (character) => {
            this.controller.send('game', 'character', { id: character.id, action: 'remove' });
          },
          update: (character?) => {
            this.controller.send('game', 'character', { action: 'update', character: character });
          },
          assignTo: (character, user) => {
            this.controller.send('game', 'character', { action: 'assignTo', character: character, user: user });
          },
          moveToMap: (character, map) => {
            this.controller.send('game', 'character', { action: 'moveToMap', character: character, map: map });
          },
          animation: (animation) => {
            this.controller.send('game', 'character', { action: 'animation', animation: animation });
          }
        }
      }
    };

    this.orderedTools = [this.tools.maps, this.tools.characters, this.tools.grid, this.tools.walls, this.tools.fogOfWar, this.tools.rule, this.tools.figure];

    this.controller.recieve('game', 'mapUpdate', (message) => {
      this.getCampaign();
    });

    this.controller.recieve('game', 'characterUpdate', (message) => {
      this.getCharacters(true);
      this.getCharacters(false);
    });
  }

  callTool(event, tool) {
    if (this.tools[tool]?.actions?.toggle) this.tools[tool].actions.toggle();
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
    console.log('getting campaign');
    this.isLoadingCampaign = true;

    this.campaignService.getCampaignById(this.campaignId).subscribe(
      data => this.campaign = data,
      error => iziToast.error({ message: 'There was an error, campaign can\'t be getted.' }),
      () => {
        if (this.campaign != null) {
          this.isLoadingCampaign = false;
          this.getOpenedMap();
        }

        this.tools.maps.actions.updateTilemap();
      }
    );
  }

  countCharacters(own: boolean): void {
    this.characterService.countCharacters({ own: own }).subscribe(
      data => {
        if (own) this.countOwnCharacters = data
        else this.countPublicCharacters = data
      },
      error => iziToast.error({ message: 'There was an error, characters can\'t be counted.' })
    );
  }

  getCharacters(own: boolean): void {
    this.countCharacters(own);
    this.characterService.getCharacters(
      {
        own: own,
        page: own ? this.pageOwnCharacters : this.pagePublicCharacters,
        count: own ? this.pageSizeOwnCharacters : this.pageSizePublicCharacters
      }
    ).subscribe(
      data => {
        if (own) this.ownCharacters = data
        else this.publicCharacters = data
      },
      error => iziToast.error({ message: 'There was an error, characeters can\'t be getted.' }),
      () => {
        if (own) this.isLoadingOwnCharacters = false
        else this.isLoadingPublicCharacters = false
      }
    );
  }

  openCharacter(character?, instancedCharacter?) {
    var modalRef = this.modalService.open(CharacterComponent, { size: 'xl', backdrop: 'static' });
    if (character) modalRef.componentInstance.character = character;
    modalRef.componentInstance.getCharacters.subscribe(() => {
      this.getCharacters(true);
      this.getCharacters(false);
      this.tools.characters.actions.update(instancedCharacter);
    });
  }

  deleteCharacter(character: Character): void {
    this.characterService.deleteCharacter(character).subscribe(
      data => iziToast.success({ message: 'Character deleted successfully.' }),
      error => iziToast.error({ message: 'There was an error, character can\'t be deleted.' }),
      () => {
        this.getCharacters(true);
        this.getCharacters(false);
        this.tools.characters.actions.update();
      }
    );
  }

  onImageError($event, defaultImage?) {
    if (defaultImage) {
      this.imageExists(defaultImage, (exists) => {
        if (exists)
          $event.target.src = defaultImage;
        else
          $event.target.src = "assets/images/campaigns/default.jpg";
      });
    } else {
      $event.target.src = "assets/images/campaigns/default.jpg";
    }
  }

  imageExists(url, callback) {
    var img = new Image();
    img.onload = function () { callback(true); };
    img.onerror = function () { callback(false); };
    img.src = url;
  }

  getOpenedMap(): void {
    console.log('getting opened map');
    this.isLoadingOpenedMap = true;

    if (this.campaign?.openedMap) {
      this.mapService.getMap(this.campaign.maps_info.find((m: any) => { return m._id == this.campaign.openedMap })).subscribe(
        data => this.openedMap = data,
        error => iziToast.error({ message: 'There was an error, can\'t get opened map.' }),
        () => this.isLoadingOpenedMap = false
      );
    } else {
      this.openedMap = null;
      this.isLoadingOpenedMap = false;
    }
  }

  openMap(map?) {
    if (this.campaign) {
      var modalRef = this.modalService.open(MapComponent);
      if (map) modalRef.componentInstance.map = map;
      modalRef.componentInstance.campaign = this.campaign;
      modalRef.componentInstance.getMaps.subscribe(() => {
        this.getCampaign();
        this.tools.maps.actions.update();
      });
    }
  }

  deleteMap(map: Map) {
    this.mapService.deleteMap(map).subscribe(
      data => {
        iziToast.success({ message: 'Map deleted successfully.' });
        this.tools.maps.actions.update();
        if (this.tools.maps.options.openedMap.value == map._id)
          this.tools.maps.actions.discard();
        if (this.tools.characters.options.selectedMap == map._id)
          this.tools.characters.options.selectedMap = null;
      },
      error => iziToast.error({ message: 'There was an error, map can\'t be deleted.' }),
      () => {
        this.getCampaign();
      }
    );
  }

  getPlayers(campaign: Campaign): string[] {
    return campaign["invitations"]?.filter(invitation => invitation.accepted).map(invitation => invitation.recipient_info);
  }
}
