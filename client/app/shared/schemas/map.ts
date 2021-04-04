import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Schema } from './schema';
import { Wall } from './wall';
import { TileMap } from './tilemap';

export class Map extends Schema {
  //schema
  mapId?: string;
  walls?: Wall[];
  doors?: Wall[];
  tilemap?: TileMap;
  //game objects
  camera?: any;
  lights?: any = {};

  constructor(schema, parameters) {
    super(parameters);

    this.synchronizeSchema(schema,
      {
        walls: {
          type: Wall, datatype: Array, parameters: (key) => {
            return {
              world: parameters.world,
              canvas: parameters.canvas,
              scene: parameters.scene,
              room: parameters.room,
              token: parameters.token,
              controller: parameters.controller,
              assets: parameters.assets,
              id: key
            }
          }
        },
        doors: {
          type: Wall, datatype: Array, parameters: (key) => {
            return {
              world: parameters.world,
              canvas: parameters.canvas,
              scene: parameters.scene,
              room: parameters.room,
              token: parameters.token,
              controller: parameters.controller,
              assets: parameters.assets,
              id: key
            }
          }
        },
        tilemap: {
          type: TileMap, datatype: Object, parameters: () => {
            return {
              world: parameters.world,
              canvas: parameters.canvas,
              scene: parameters.scene,
              room: parameters.room,
              token: parameters.token,
              controller: parameters.controller,
              assets: parameters.assets
            }
          }
        }
      }
    );
  }

  update(changes) {
    changes?.forEach((change) => {
      switch (change.field) {
        case 'mapId':
          this.parameters.controller.updateSetting('openedMap', this.mapId);
          break;
      }
    });
  }

  remove() {
    super.remove();
    this.parameters.controller.updateSetting('openedMap', null);
  }

  // update(changes) {
  //   console.log("mapChanges", changes);
  //   changes?.forEach((change) => {
  //     switch (change.field) {
  //       case 'destroy':
  //         console.log("mapDestroy", change.value);
  //         break;
  //     }
  //   });
  // }
}
