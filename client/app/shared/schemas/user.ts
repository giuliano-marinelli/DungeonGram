import { Schema } from './schema';

export class User extends Schema {
  //schema
  id?: string;
  wallsVisibility?: number;
  wallsPickable?: boolean;
  fogOfWarVisibility?: number;
  tilemapShowGrid?: number;

  constructor(schema, parameters) {
    super(parameters);

    this.id = parameters.id;

    this.synchronizeSchema(schema);
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
