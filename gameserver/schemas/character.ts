import { Schema, type, MapSchema } from '@colyseus/schema';
import { Path } from './path';
import { Point } from './point';
import { Wear } from './wear';
import { CharacterPhysics } from '../physics/character.physics';
import { Vector } from 'matter-js';
import { Utils } from '../utils';

export class Character extends Schema {
  @type("number")
  x = 0;
  @type("number")
  y = 0;
  @type(Point)
  direction: Point = new Point(1, 0);
  @type(Path)
  movementPath: Path = new Path();
  @type("number")
  movementCooldown = 200;
  @type("boolean")
  beignDragged = false;
  @type("number")
  visionRange = 10;
  @type({ map: Wear })
  wears = new MapSchema<Wear>();
  //internal attributes
  movementAcum = 0;
  collide = false;
  //physics
  characterPhysics: CharacterPhysics;
  //shared physics attributes for test
  @type("number")
  xPhysics = 0;
  @type("number")
  yPhysics = 0;
  @type("boolean")
  isCollidingPhysics = false;

  constructor() {
    super();
    // var skinColor = Utils.randomHexColor();
    // this.wears[Utils.uuidv4()] = new Wear('skin', 'color', 'none', skinColor);
    // this.wears[Utils.uuidv4()] = new Wear('head', 'ears', 'elf.ears', skinColor);
    // this.wears[Utils.uuidv4()] = new Wear('head', 'hair', 'mohicano', Utils.randomHexColor());
    // this.wears[Utils.uuidv4()] = new Wear('torso', 'chest', 'padded.armor.chest', Utils.randomHexColor());
    // this.wears[Utils.uuidv4()] = new Wear('torso', 'hips', 'padded.armor.hips', Utils.randomHexColor());
    // this.wears[Utils.uuidv4()] = new Wear('legs', 'feet', 'leather.boots', Utils.randomHexColor());
    // this.wears[Utils.uuidv4()] = new Wear('legs', 'knees', 'metal.kneepads', Utils.randomHexColor());
    this.wears[Utils.uuidv4()] = new Wear('skin', 'color', 'none', '#dc9b78');
    this.wears[Utils.uuidv4()] = new Wear('head', 'ears', 'elf.ears', '#dc9b78');
    this.wears[Utils.uuidv4()] = new Wear('head', 'hair', 'mohicano', '#ffc107');
    this.wears[Utils.uuidv4()] = new Wear('torso', 'chest', 'breastplate', '#c8e1eb');
    this.wears[Utils.uuidv4()] = new Wear('torso', 'hips', 'padded.armor.hips', '#8c3c32');
    this.wears[Utils.uuidv4()] = new Wear('legs', 'feet', 'leather.boots', '#111111');
    this.wears[Utils.uuidv4()] = new Wear('legs', 'knees', 'metal.kneepads', '#c8e1eb');
  }

  update(deltaTime: number) {
    if (this.movementPath.points.length) {
      //update physics position previous to logic position for check that it's not collide
      //firt move to middle grid
      // if (this.movementAcum > 55 && this.movementAcum <= 100) {
      //   var middlePoint = Vector.div(Vector.add({ x: this.x, y: this.y }, this.movementPath.points[0]), 2);
      //   this.characterPhysics.move(middlePoint.x, middlePoint.y);
      //    this.collide = this.characterPhysics.isColliding; //save colliding info
      // }
      //then move to the target grid
      // if (this.movementAcum > 10 && this.movementAcum <= 55) {
      //   this.characterPhysics.move(this.movementPath.points[0].x, this.movementPath.points[0].y);
      //    if (!this.collide) this.collide = this.characterPhysics.isColliding; //save colliding info
      // }
      //then moves the logic position if the physics not collide in any of previous
      if (this.movementAcum == 0) {
        if (!this.collide) {
          this.direction.x = this.movementPath.points[0].x - this.x;
          this.direction.y = this.movementPath.points[0].y - this.y;
          this.x = this.movementPath.points[0].x;
          this.y = this.movementPath.points[0].y;
          this.characterPhysics.move(this.x, this.y);
          this.movementPath.doPoint();
          if (this.movementPath.points.length) {
            this.movementAcum = this.movementCooldown;
          }
        } else {
          this.movementPath.unset();
          this.characterPhysics.move(this.x, this.y);
          this.collide = false;
        }
      } else {
        this.movementAcum = (this.movementAcum - deltaTime <= 0) ? 0 : this.movementAcum - deltaTime;
      }
    }
    this.updatePhysics();
  }

  updatePhysics() {
    // console.log(this.characterPhysics.body.position);
    if (this.xPhysics != this.characterPhysics.body.position.x)
      this.xPhysics = this.characterPhysics.body.position.x;
    if (this.yPhysics != this.characterPhysics.body.position.y)
      this.yPhysics = this.characterPhysics.body.position.y;
    if (this.isCollidingPhysics != this.characterPhysics.isColliding)
      this.isCollidingPhysics = this.characterPhysics.isColliding;
  }

  move(movement: any) {
    if (movement.x != this.x || movement.y != this.y) {
      //set a initial cooldown so physics movement do first
      // this.movementAcum = 100;
      var path = this.characterPhysics.getPath({ x: movement.x, y: movement.y });
      if (path.length) {
        this.movementPath.set({
          from: new Point(this.x, this.y),
          to: new Point(path[path.length - 1].x, path[path.length - 1].y),//new Point(movement.x, movement.y),
          path: path
        });
      }
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
      this.characterPhysics.move(this.x, this.y); //update physics position
    }
  }

  drop(snapToGrid) {
    this.beignDragged = false;
    this.x = snapToGrid == null || snapToGrid ? Math.round(this.x) : this.x;
    this.y = snapToGrid == null || snapToGrid ? Math.round(this.y) : this.y;
    this.characterPhysics.move(this.x, this.y); //update physics position
  }
}
