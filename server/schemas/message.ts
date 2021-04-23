import { Schema, type } from "@colyseus/schema";
import { Roll } from '../schemas/roll';

export class Message extends Schema {
  @type("string")
  user: string;
  @type("string")
  username: string;
  @type("string")
  content: string;
  @type("number")
  date: number;

  constructor(content: string, userObj?: any) {
    super();
    this.user = userObj?._id?.toString();
    this.username = userObj?.username;
    this.date = Date.now();
    this.addContent(content);
  }

  addContent(content) {
    var roll = new Roll(content);
    var newContent = '<p>' + (roll.isRoll
      ? '<i>rolling</i> ' + roll.rolls.join(' + ') + '<br><span class="text-muted">' +
      (roll.getSum() + ' = </span><span class="badge badge-light">' + roll.getValue()) + '</span>'
      : (content ? content : "")) + '</p>';
    this.content = this.content ? this.content + newContent : newContent;
  }

  public toString = (): string => {
    return `${this.user}: "${this.content}"`;
  }
}
