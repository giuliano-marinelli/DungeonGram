import { Schema } from './schema';
import { Rule } from './rule';
import { Figure } from './figure';

export class User extends Schema {
  //schema
  id?: string;
  wallsVisibility?: number;
  wallsPickable?: boolean;
  fogOfWarVisibility?: number;
  tilemapShowGrid?: number;
  rule?: Rule;
  figureDrawer?: Figure;
  selectedPlayer?: string;

  constructor(schema, parameters) {
    super(parameters);

    this.id = parameters.id;

    this.synchronizeSchema(schema, {
      rule: {
        type: Rule, datatype: Object, parameters: () => {
          return {
            userId: this.id,
            canvas: parameters.canvas,
            scene: parameters.scene,
            room: parameters.room,
            token: parameters.token,
            controller: parameters.controller
          }
        }
      },
      figureDrawer: {
        type: Figure, datatype: Object, parameters: () => {
          return {
            userId: this.id,
            canvas: parameters.canvas,
            scene: parameters.scene,
            room: parameters.room,
            token: parameters.token,
            controller: parameters.controller
          }
        }
      }
    });
  }

  update(changes?) {
    if (this.id == this.parameters.token) {
      changes?.forEach((change) => {
        switch (change.field) {
          case 'wallsVisibility':
            this.parameters.world.updateWalls();
            break;
          case 'wallsPickable':
            this.parameters.world.updateWalls();
            break;
          case 'fogOfWarVisibility':
            this.parameters.world.updateFogOfWar();
            break;
          case 'tilemapShowGrid':
            this.parameters.world.updateTilemap();
            break;
          case 'selectedPlayer':
            this.parameters.world.updatePlayersVisibility();
            if (change.previousValue && this.parameters.world.players) this.parameters.world.players[change.previousValue]?.initVisionLight();
            if (change.value && this.parameters.world.players) this.parameters.world.players[change.value]?.initVisionLight();
            this.parameters.world.updateLights();
            this.parameters.world.updateShadows();
            break;
        }
      });
    }
  }
}
