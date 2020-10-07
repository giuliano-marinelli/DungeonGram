import { Schema, type } from "@colyseus/schema";
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

  constructor(from: any, to: any, size: string) {
    super();
    this.from = new Point(from.x, from.y);
    this.to = new Point(to.x, to.y);
    this.size = size;
  }
}
