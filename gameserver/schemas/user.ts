import { Schema, type } from '@colyseus/schema';
import { Rule } from '../schemas/rule';
import { Figure } from '../schemas/figure';

import { default as UserDB } from '../../database/models/user';

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
  @type(Figure)
  figureDrawer: Figure;
  @type("string")
  selectedCharacter: string;
  @type("string")
  addingModeCharacter: string;
  @type("string")
  addingModeModel: string;
  @type("boolean")
  isDM: boolean;
  @type("string")
  username: string;
  @type("string")
  email: string;
  @type("string")
  avatar: string;

  db: any;

  constructor(wallsVisibility: number = 0, wallsPickable: boolean = false,
    fogOfWarVisibility: number = 0, tilemapShowGrid: boolean = true,
    rule: Rule = new Rule(), figureDrawer: Figure = new Figure, selectedCharacter?: string, isDM: boolean = false) {
    super();
    this.wallsVisibility = wallsVisibility;
    this.wallsPickable = wallsPickable;
    this.fogOfWarVisibility = fogOfWarVisibility;
    this.tilemapShowGrid = tilemapShowGrid;
    this.rule = rule;
    this.figureDrawer = figureDrawer;
    this.selectedCharacter = selectedCharacter;
    this.isDM = isDM;
  }

  async load(userId: string) {
    this.db = await UserDB.findOne({ _id: userId });
    if (this.db) {
      this.username = this.db.username;
      this.email = this.db.email;
      this.avatar = this.db.avatar;
    }
  }
}
