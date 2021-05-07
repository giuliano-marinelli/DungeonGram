import { Schema, type } from '@colyseus/schema';
import { Rule } from '../schemas/rule';
import { Figure } from '../schemas/figure';

import { default as UserDB } from '../../database/models/user';

export class User extends Schema {
  @type("number")
  wallsVisibility: number = 0;
  @type("boolean")
  wallsPickable: boolean = false;
  @type("number")
  fogOfWarVisibility: number = 0;
  @type("boolean")
  tilemapShowGrid: boolean = true;
  @type(Rule)
  rule: Rule = new Rule();
  @type(Figure)
  figureDrawer: Figure = new Figure();
  @type("string")
  selectedCharacter: string;
  @type("string")
  addingModeCharacter: string;
  @type("string")
  addingModeModel: string;
  @type("boolean")
  isDM: boolean = false;
  @type("boolean")
  isPlayer: boolean = false;
  @type("string")
  username: string;
  @type("string")
  email: string;
  @type("string")
  avatar: string;
  @type("number")
  latency: number;

  db: any;

  constructor() {
    super();
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
