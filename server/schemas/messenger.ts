import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { Utils } from "../utils";
import { Message } from '../schemas/message';

export class Messenger extends Schema {
  @type({ map: Message })
  messages = new MapSchema<Message>();

  lastMessage: Message;

  constructor() {
    super();
  }

  addMessage(content: string, userObj?: any) {
    var lastMessageDate = new Date(this.lastMessage?.date);
    var newMessageDate = new Date(Date.now());
    if (!this.lastMessage || this.lastMessage.user != userObj?._id?.toString() ||
      Math.abs(newMessageDate.getTime() - lastMessageDate.getTime()) > 1000 * 60 * 5) {
      var messageId = Utils.uuidv4();
      this.messages[messageId] = new Message(content, userObj);
      this.lastMessage = this.messages[messageId];
    } else {
      this.lastMessage.addContent(content);
    }
  }
}
