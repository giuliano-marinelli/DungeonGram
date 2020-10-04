import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';
import { User } from './user';
import { Player } from '../schemas/player';
import { TileMap } from '../schemas/tilemap';
import { Point } from './point';
import { Wall } from './wall';
import { Utils } from '../rooms/game';

export class World extends Schema {
  @type({ map: User })
  users = new MapSchema<User>();
  @type({ map: Player })
  players = new MapSchema<Player>();
  @type({ map: Wall })
  walls = new MapSchema<Wall>();
  @type(TileMap)
  tilemap: TileMap = new TileMap(50, 50);

  wallFirstPoint: Point;
  // wallVisibility: number = 0.5;
  // wallPickable: boolean = false;

  createUser(id: string) {
    console.log("Create User", id);
    this.users[id] = new User();
  }

  removeUser(id: string) {
    delete this.users[id];
  }

  createPlayer(id: string) {
    console.log("Create Player", id);
    this.players[id] = new Player();
  }

  removePlayer(id: string) {
    delete this.players[id];
  }

  movePlayer(id: string, movement: any) {
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

  removeWall(wallId: string) {
    delete this.walls[wallId];
  }

  setWallVisibility(id: string, value: number) {
    this.users[id].wallsVisibility = value;
  }

  setWallPickable(id: string, value: boolean) {
    this.users[id].wallsPickable = value;
  }

  setFogOfWarVisibility(id: string, value: number) {
    this.users[id].fogOfWarVisibility = value;
  }

  setTilemapShowGrid(id: string, value: number) {
    this.users[id].tilemapShowGrid = value;
  }

  startRule(id: string, point: Point) {
    this.users[id].rule.start(point);
  }

  moveRule(id: string, point: Point) {
    this.users[id].rule.move(point);
  }

  addRule(id: string, point: Point) {
    this.users[id].rule.add(point);
  }

  endRule(id: string) {
    this.users[id].rule.end();
  }
}
