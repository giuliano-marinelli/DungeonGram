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
  tilemap: TileMap = new TileMap(20, 20);

  wallFirstPoint: Point;
  // wallVisibility: number = 0.5;
  // wallPickable: boolean = false;

  createUser(id: string) {
    console.log("Create User", id);
    this.users[id] = new User();
    this.users[id].selectedPlayer = id;
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

  movePlayer(id: string, point: Point) {
    if(this.users[id].selectedPlayer) this.players[this.users[id].selectedPlayer].move(point);
  }

  dragPlayer(playerId: string, point?: Point) {
    this.players[playerId].drag(point);
  }

  dropPlayer(playerId: string) {
    this.players[playerId].drop();
  }

  selectPlayer(id: string, value: string) {
    this.users[id].selectedPlayer = this.users[id].selectedPlayer != value ? value : null;
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

  shareRule(id: string, value: boolean) {
    this.users[id].rule.shared = value;
  }

  normalizeUnitRule(id: string, value: boolean) {
    this.users[id].rule.normalizeUnit = value;
  }

  startFigure(id: string, point: Point) {
    this.users[id].figureDrawer.start(point);
  }

  moveFigure(id: string, point: Point) {
    this.users[id].figureDrawer.move(point);
  }

  endFigure(id: string) {
    this.users[id].figureDrawer.end();
  }

  shareFigure(id: string, value: boolean) {
    this.users[id].figureDrawer.shared = value;
  }

  normalizeUnitFigure(id: string, value: boolean) {
    this.users[id].figureDrawer.normalizeUnit = value;
  }
}
