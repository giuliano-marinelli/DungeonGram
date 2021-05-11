import { Schema, type, ArraySchema } from "@colyseus/schema";
import { Point } from '../schemas/point';

export class Path extends Schema {
  @type(Point)
  from: Point;
  @type(Point)
  to: Point;
  @type([Point])
  points = new ArraySchema<Point>();
  @type('boolean')
  temporal: boolean = false;

  //for destroy the object
  @type('boolean')
  destroy: boolean = false;

  constructor(options?) {
    super();

    if (options?.temporal) this.temporal = options?.temporal;
  }

  set(options) {
    this.from = options.from;
    this.to = options.to;

    this.points.splice(0, this.points.length);

    setTimeout(() => {
      if (!options.path) {
        if (options.from && options.to)
          this.generatePath(options.from, options.to);
      } else {
        options.path.forEach((point) => {
          this.points.push(new Point(point.x, point.y));
        });
      }

    }, 100);
  }

  doPoint() {
    this.points.shift();
    if (!this.points.length) {
      this.from = null;
      this.to = null;
    }
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
      if (from.x != to.x) {
        if (Math.abs(from.x - to.x) >= 1)
          nextPoint.x = from.x < to.x ? from.x + 1 : from.x - 1;
        else
          nextPoint.x = to.x
      }
      if (from.y != to.y) {
        if (Math.abs(from.y - to.y) >= 1)
          nextPoint.y = from.y < to.y ? from.y + 1 : from.y - 1
        else
          nextPoint.y = to.y
      }

      this.points.push(nextPoint);
      this.generatePath(nextPoint, to);
    }
  }

  remove() {
    this.destroy = true;
  }

}
