import { Schema, type } from "@colyseus/schema";
import { Point } from './point';

export class Door extends Schema {
  @type(Point)
  from: Point;
  @type(Point)
  to: Point;

  constructor(from: Point, to: Point) {
    super();
    this.from = from;
    this.to = to;
  }
}
