import { Schema, type, ArraySchema } from "@colyseus/schema";
import { Point } from '../schemas/point';

export class Rule extends Schema {
  @type([Point])
  points = new ArraySchema<Point>();
  @type("boolean")
  shared = false;
  @type("boolean")
  normalizeUnit = true;

  constructor() {
    super();
  }

  unset() {
    this.points.splice(0, this.points.length);
  }

  start(point) {
    this.points.push(new Point(point.x, point.y));
    this.points.push(new Point(point.x, point.y));
  }

  move(point) {
    if (this.points[this.points.length - 1]) {
      this.points[this.points.length - 1].x = point.x;
      this.points[this.points.length - 1].y = point.y;
    }
  }

  add(point) {
    this.points.push(new Point(point.x, point.y));
    console.log(this.points);
  }

  end() {
    this.unset();
  }
}