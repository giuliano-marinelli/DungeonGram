import { World, Body, Bodies, Constraint } from 'matter-js';

export class EntityPhysics {
  type: string;
  body: any;
  isColliding: boolean;

  constructor(type: string) {
    this.type = type;
  }

  setColliding(isColliding: boolean, entityColliding: EntityPhysics) {
    this.isColliding = isColliding;
  }
}
