import { Room } from "colyseus";
import { Roll } from '../schemas/roll';

export class ChatRoom extends Room {
  onCreate(options) {
    console.log("ChatRoom: Created", options);

    this.onMessage("message", (client, message) => {
      console.log("ChatRoom: received message from", client.sessionId, ":", message);
      var roll = new Roll(message);
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
    console.log("ChatRoom: Dispose");
  }

}
