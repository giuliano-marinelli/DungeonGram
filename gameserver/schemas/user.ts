import { Schema, type } from '@colyseus/schema';

export class User extends Schema {
  @type("number")
  wallsVisibility: number;
  @type("boolean")
  wallsPickable: boolean;
  @type("number")
  fogOfWarVisibility: number;
  @type("boolean")
  tilemapShowGrid: boolean;

  constructor(wallsVisibility: number = 0.5, wallsPickable: boolean = false, fogOfWarVisibility: number = 0, tilemapShowGrid: boolean = true) {
    super();
    this.wallsVisibility = wallsVisibility;
    this.wallsPickable = wallsPickable;
    this.fogOfWarVisibility = fogOfWarVisibility;
    this.tilemapShowGrid = tilemapShowGrid;
  }
}
