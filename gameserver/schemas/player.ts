import { Schema, type } from '@colyseus/schema';
import { Path } from '../schemas/path';
import { Point } from '../schemas/point';
import { PlayerPhysics } from '../physics/player.physics';
import { Vector } from 'matter-js';
export class Player extends Schema {
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
  collide = false;
  //physics
  playerPhysics: PlayerPhysics;
  //shared physics attributes for test
  @type("number")
  xPhysics = 0;
  @type("number")
  yPhysics = 0;
  @type("boolean")
  isCollidingPhysics = false;

  update(deltaTime: number) {
    if (this.movementPath.points.length) {
      //update physics position previous to logic position for check that it's not collide
      //firt move to middle grid
      if (this.movementAcum > 55 && this.movementAcum <= 100) {
        var middlePoint = Vector.div(Vector.add({ x: this.x, y: this.y }, this.movementPath.points[0]), 2);
        this.playerPhysics.move(middlePoint.x, middlePoint.y);
        this.collide = this.playerPhysics.isColliding; //save colliding info
      }
      //then move to the target grid
      if (this.movementAcum > 10 && this.movementAcum <= 55) {
        this.playerPhysics.move(this.movementPath.points[0].x, this.movementPath.points[0].y);
        if (!this.collide) this.collide = this.playerPhysics.isColliding; //save colliding info
      }
      //then moves the logic position if the physics not collide in any of previous
      if (this.movementAcum == 0) {
        if (!this.collide) {
          this.direction.x = this.movementPath.points[0].x - this.x;
          this.direction.y = this.movementPath.points[0].y - this.y;
          this.x = this.movementPath.points[0].x;
          this.y = this.movementPath.points[0].y;
          this.playerPhysics.move(this.x, this.y);
          this.movementPath.doPoint();
          if (this.movementPath.points.length) {
            this.movementAcum = this.movementCooldown;
          }
        } else {
          this.movementPath.unset();
          this.playerPhysics.move(this.x, this.y);
          this.collide = false;
        }
      } else {
        this.movementAcum = (this.movementAcum - deltaTime <= 0) ? 0 : this.movementAcum - deltaTime;
      }
    }
    this.updatePhysics();
  }

  updatePhysics() {
    // console.log(this.playerPhysics.body.position);
    if (this.xPhysics != this.playerPhysics.body.position.x)
      this.xPhysics = this.playerPhysics.body.position.x;
    if (this.yPhysics != this.playerPhysics.body.position.y)
      this.yPhysics = this.playerPhysics.body.position.y;
    if (this.isCollidingPhysics != this.playerPhysics.isColliding)
      this.isCollidingPhysics = this.playerPhysics.isColliding;
  }

  move(movement: any) {
    if (movement.x != this.x || movement.y != this.y) {
      //set a initial cooldown so physics movement do first
      this.movementAcum = 100;
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
      this.playerPhysics.move(this.x, this.y); //update physics position
    }
  }

  drop() {
    this.beignDragged = false;
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    this.playerPhysics.move(this.x, this.y); //update physics position
  }
}
