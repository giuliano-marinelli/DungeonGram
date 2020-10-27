import { Schema, type, ArraySchema } from "@colyseus/schema";
import { Point } from './point';
import { WallPhysics } from '../physics/wall.physics';

export class Wall extends Schema {
  @type(Point)
  from: Point;
  @type(Point)
  to: Point;
  @type("string")
  size = 'large'
  //physics
  wallPhysics: WallPhysics;
  //shared physics attributes for test
  @type([Point])
  tilesPhysics = new ArraySchema<Point>();

  //for destroy the object
  @type('boolean')
  destroy: boolean = false;

  constructor(from: any, to: any, size: string) {
    super();
    this.from = new Point(from.x, from.y);
    this.to = new Point(to.x, to.y);
    this.size = size;
  }

  updatePhysics() {
    this.wallPhysics.tiles.forEach((tile) => {
      this.tilesPhysics.push(new Point((tile.x / 2) - 0.5, (tile.y / 2) - 0.5));
    });
  }

  remove() {
    this.destroy = true;
  }
}
