import { Schema, type, ArraySchema } from "@colyseus/schema";
import { Point } from '../schemas/point';

export class Path extends Schema {
  @type(Point)
  from: Point;
  @type(Point)
  to: Point;
  @type([Point])
  points = new ArraySchema<Point>();

  constructor(from?: Point, to?: Point) {
    super();
    this.set(from, to);
  }

  set(from?: any, to?: any) {
    this.from = from;
    this.to = to;

    this.points.splice(0, this.points.length);

    setTimeout(() => {
      if (from && to)
        this.generatePath(from, to);
    }, 100);
  }

  unset() {
    this.from = null;
    this.to = null;

    this.points.splice(0, this.points.length);
  }

  generatePath(from: any, to: any) {
    if ((from.x != to.x || from.y != to.y) && this.points.length < 10000) {
      var nextPoint = new Point();
      // if (from.x != to.x) {
      //   nextPoint.x = from.x < to.x ? from.x + 1 : from.x - 1
      //   nextPoint.y = from.y;
      // } else {
      //   nextPoint.y = from.y < to.y ? from.y + 1 : from.y - 1
      //   nextPoint.x = from.x;
      // }
      nextPoint.x = from.x;
      nextPoint.y = from.y;
      if (from.x != to.x)
        nextPoint.x = from.x < to.x ? from.x + 1 : from.x - 1
      if (from.y != to.y)
        nextPoint.y = from.y < to.y ? from.y + 1 : from.y - 1

      this.points.push(nextPoint);
      this.generatePath(nextPoint, to);
    }
  }
}
