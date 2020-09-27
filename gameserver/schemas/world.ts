import { Schema, type, MapSchema } from '@colyseus/schema';
import { Player } from '../schemas/player';
import { TileMap } from '../schemas/tilemap';

export class World extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  @type(TileMap)
  tilemap = new TileMap(50, 25);

  createPlayer(id: string) {
    this.players[id] = new Player();
  }

  removePlayer(id: string) {
    delete this.players[id];
  }

  movePlayer(id: string, movement: any) {
    this.players[id].move(movement);
  }

  update(deltaTime: number) {
    for (var id in this.players) {
      this.players[id].update(deltaTime);
    }
  }
}
