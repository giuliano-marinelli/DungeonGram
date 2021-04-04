import { Schema, type, ArraySchema } from "@colyseus/schema";
import { Point } from './point';
import { WallPhysics } from '../physics/wall.physics';
import { Utils } from "../utils";

export class Wall extends Schema {
  @type(Point)
  from: Point;
  @type(Point)
  to: Point;
  @type("string")
  size = 'large';
  @type("string")
  type = 'wall';
  //physics
  wallPhysics: WallPhysics;
  //shared physics attributes for test
  @type([Point])
  tilesPhysics = new ArraySchema<Point>();

  //for destroy the object
  @type('boolean')
  destroy: boolean = false;

  constructor(from: any, to: any, size: string, type: string) {
    super();
    this.from = new Point(from.x, from.y);
    this.to = new Point(to.x, to.y);
    this.size = size;
    this.type = type;
  }

  updatePhysics() {
    this.tilesPhysics.splice(0, this.tilesPhysics.length);
    setTimeout(() => {
      this.wallPhysics.tiles.forEach((tile) => {
        this.tilesPhysics.push(new Point((tile.x / 2) - 0.5, (tile.y / 2) - 0.5));
      });
    }, 100);
  }

  rotateTo(point: any) {
    var newTo = Utils.rotateByPoint(this.from, this.to, point);
    this.to = new Point(newTo.x, newTo.y);
    this.wallPhysics.to = { x: Math.round((this.to.x + 0.5) * 2), y: Math.round((this.to.y + 0.5) * 2) }
  }

  remove() {
    this.destroy = true;
  }
}
