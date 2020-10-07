import { Room } from "colyseus";
import { Roll } from '../schemas/roll';

export class ChatRoom extends Room {
  onCreate(options) {
    console.log("ChatRoom: created", options);

    this.onMessage("message", (client, message) => {
      console.log('ChatRoom: client', client.sessionId, 'send message =>', message);
      var roll = new Roll(message);
      console.log(roll);
      this.broadcast("messages", '<b>' + client.sessionId + '</b> ' +
        (roll.isRoll
          ? 'rolling ' + roll.rolls.join(' + ') + '<br>' + (roll.getSum() + ' = ' + roll.getValue())
          : message ? message : ""
        ));
    });
  }

  onJoin(client) {
    this.broadcast("messages", `<b>${client.sessionId}</b> joined.`);
  }

  onLeave(client) {
    this.broadcast("messages", `<b>${client.sessionId}</b> left.`);
  }

  onDispose() {
    console.log("ChatRoom: dispose");
  }

}
