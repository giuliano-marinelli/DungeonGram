import { Schema, type } from '@colyseus/schema';
import { Path } from '../schemas/path';
import { Point } from '../schemas/point';

export class Player extends Schema {
  // @type("string")
  // id;
  @type("number")
  x = 0;
  @type("number")
  y = 0;
  @type(Point)
  direction: Point = new Point(1, 0);
  @type(Path)
  movementPath: Path = new Path();
  @type("number")
  movementCooldown = 500;
  @type("boolean")
  beignDragged = false;
  @type("number")
  visionRange = 10;
  //internal attributes
  movementAcum = 0;

  update(deltaTime: number) {
    if (this.movementPath.points.length) {
      if (this.movementAcum == 0) {
        var nextIndex = this.movementPath.points.length - 1;
        this.direction.x = this.movementPath.points[0].x - this.x;
        this.direction.y = this.movementPath.points[0].y - this.y;
        this.x = this.movementPath.points[0].x;
        this.y = this.movementPath.points[0].y;
        this.movementPath.points.shift();
        if (!this.movementPath.points.length) {
          this.movementPath.from = null;
          this.movementPath.to = null;
        } else {
          this.movementAcum = this.movementCooldown;
        }
      } else {
        this.movementAcum = (this.movementAcum - deltaTime <= 0) ? 0 : this.movementAcum - deltaTime;
      }
    }
  }

  move(movement: any) {
    if (movement.x != this.x || movement.y != this.y) {
      this.movementPath.set(new Point(this.x, this.y), new Point(movement.x, movement.y));
    }
    // console.log(JSON.stringify(this.movementPath.from), JSON.stringify(this.movementPath.to));
    // console.table(this.movementPath.points);
    // this.movementPath.points.forEach((point) => {
    //   console.log(JSON.stringify(point));
    // });
  }

  drag(position?) {
    this.beignDragged = true;
    this.movementPath.unset();
    if (position) {
      this.x = position.x;
      this.y = position.y;
    }
  }

  drop() {
    this.beignDragged = false;
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
  }
}
