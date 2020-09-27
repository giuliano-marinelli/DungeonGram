import { Schema, type } from '@colyseus/schema';
import { Path } from '../schemas/path';
import { Point } from '../schemas/point';

export class Player extends Schema {
  @type("number")
  x = 0;
  @type("number")
  y = 0;
  @type(Point)
  direction: any = new Point(1, 0);
  @type(Path)
  movementPath = new Path();
  //internal attributes
  movementAcum = 0;
  @type("number")
  movementCooldown = 500;

  move(movement: any) {
    this.movementPath = new Path(new Point(this.x, this.y), new Point(movement.x, movement.y));
    // console.log(JSON.stringify(this.movementPath.from), JSON.stringify(this.movementPath.to));
    // console.table(this.movementPath.points);
    // this.x = movement.x != null ? movement.x : 0;
    // this.y = movement.y != null ? movement.y : 0;
  }

  update(deltaTime: number) {
    if (this.movementPath.points.length) {
      if (this.movementAcum == 0) {
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
}
