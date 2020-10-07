import { World, Body, Bodies, Constraint } from 'matter-js';
import { EntityPhysics } from './entity.physics';

export class PlayerPhysics extends EntityPhysics {
  body: any;
  isColliding: boolean = false;

  constructor(id: string, type: string, parameters: any) {
    super(type);
    //isSensor: triggers collision events, but doesn't react with colliding body physically
    this.body = Bodies.rectangle(parameters.x, parameters.y, 0.9, 0.9, { isSensor: true });
    this.body.id = id;
  }

  move(x: number, y: number) {
    Body.setPosition(this.body, { x: x, y: y });
  }

  setColliding(isColliding, entityColliding) {
    if (isColliding && entityColliding.type == 'wall')
      this.isColliding = isColliding;
    else if (!isColliding)
      this.isColliding = isColliding
  }
}
