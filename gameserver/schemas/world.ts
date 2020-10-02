import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';
import { Player } from '../schemas/player';
import { TileMap } from '../schemas/tilemap';
import { Point } from './point';
import { Wall } from './wall';
import { Utils } from '../rooms/game';

export class World extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  @type({ map: Wall })
  walls = new MapSchema<Wall>();

  @type(TileMap)
  tilemap: TileMap = new TileMap(50, 50);

  wallFirstPoint: Point;

  createPlayer(id: string) {
    console.log("Create Player", id);
    // this.players.set(id, new Player());
    // this.players.get(id).id = id;
    this.players[id] = new Player();
  }

  removePlayer(id: string) {
    // this.players.delete(id);
    delete this.players[id];
  }

  movePlayer(id: string, movement: any) {
    // this.players.get(id).move(movement);
    this.players[id].move(movement);
  }

  dragPlayer(id: string, data: any) {
    if (data.id) {
      if (data.action == 'drag')
        this.players[data.id].drag(data.position);
      else if (data.action == 'drop')
        this.players[data.id].drop();
    }
  }

  update(deltaTime: number) {
    // this.players.forEach((player) => {
    //   player.update(deltaTime);
    // });
    for (var id in this.players) {
      this.players[id].update(deltaTime);
    }
  }

  createWall(lastPoint: Point) {
    if (this.wallFirstPoint &&
      (this.wallFirstPoint.x != lastPoint.x || this.wallFirstPoint.y != lastPoint.y)) {
      this.walls[Utils.uuidv4()] = new Wall(this.wallFirstPoint, lastPoint);
    }
    this.wallFirstPoint = null;
  }

  removeWall(id: string) {
    delete this.walls[id];
  }
}
