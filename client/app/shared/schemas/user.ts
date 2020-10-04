import { Schema } from './schema';
import { Rule } from './rule';

export class User extends Schema {
  //schema
  id?: string;
  wallsVisibility?: number;
  wallsPickable?: boolean;
  fogOfWarVisibility?: number;
  tilemapShowGrid?: number;
  rule?: Rule;

  constructor(schema, parameters) {
    super(parameters);

    this.id = parameters.id;

    this.synchronizeSchema(schema,{
        rule: {
          type: Rule, datatype: Object, parameters: () => {
            return {
              userId: this.id,
              canvas: parameters.canvas,
              scene: parameters.scene,
              room: parameters.room,
              controller: parameters.controller
            }
          }
        }
    });
  }

  update(changes?) {
    if (this.id == this.parameters.room.sessionId) {
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
        }
      });
    }
  }
}
