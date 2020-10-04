import { Schema, type } from '@colyseus/schema';
import { Rule } from '../schemas/rule';

export class User extends Schema {
  @type("number")
  wallsVisibility: number;
  @type("boolean")
  wallsPickable: boolean;
  @type("number")
  fogOfWarVisibility: number;
  @type("boolean")
  tilemapShowGrid: boolean;
  @type(Rule)
  rule: Rule;

  constructor(wallsVisibility: number = 0.5, wallsPickable: boolean = false, fogOfWarVisibility: number = 0, tilemapShowGrid: boolean = true, rule: Rule = new Rule()) {
    super();
    this.wallsVisibility = wallsVisibility;
    this.wallsPickable = wallsPickable;
    this.fogOfWarVisibility = fogOfWarVisibility;
    this.tilemapShowGrid = tilemapShowGrid;
    this.rule = rule;
  }
}
