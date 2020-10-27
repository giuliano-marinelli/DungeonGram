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
  selectedCharacter?: string;

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
            if (this.id == this.parameters.token) this.parameters.controller.updateSetting('wallsVisibility', this.wallsVisibility);
            break;
          case 'wallsPickable':
            this.parameters.world.updateWalls();
            break;
          case 'fogOfWarVisibility':
            this.parameters.world.updateFogOfWar();
            if (this.id == this.parameters.token) this.parameters.controller.updateSetting('fogOfWarVisibility', this.fogOfWarVisibility);
            break;
          case 'tilemapShowGrid':
            this.parameters.world.updateTilemap();
            if (this.id == this.parameters.token) this.parameters.controller.updateSetting('tilemapShowGrid', this.tilemapShowGrid);
            break;
          case 'selectedCharacter':
            this.parameters.world.updateCharactersVisibility();
            if (change.previousValue && this.parameters.world.map?.characters) this.parameters.world.map?.characters[change.previousValue]?.initVisionLight();
            if (change.value && this.parameters.world.map?.characters) this.parameters.world.map?.characters[change.value]?.initVisionLight();
            this.parameters.world.updateLights();
            this.parameters.world.updateShadows();
            break;
        }
      });
    }
  }
}
