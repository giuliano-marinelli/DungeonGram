import { World, Body, Bodies, Constraint } from 'matter-js';

export class EntityPhysics {
  type: string;
  body: any;
  isColliding: boolean = false;
  isWalkable: boolean = true;
  grid: any;

  constructor(type: string, grid: any) {
    this.type = type;
    this.grid = grid;
  }

  setColliding(isColliding: boolean, entityColliding: EntityPhysics) {
    this.isColliding = isColliding;
  }

  updateGrid(newGrid?) {
    if (newGrid) this.grid = newGrid;
    //to do in subclass
  }
}
