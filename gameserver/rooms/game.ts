import { Room, Client } from 'colyseus';
import { Schema, type, MapSchema } from '@colyseus/schema';
import { World } from '../schemas/world';

export class State extends Schema {
  @type(World)
  world = new World();
}

export class GameRoom extends Room<State> {
  onCreate(options) {
    console.log("GameRoom: Created", options);

    this.setState(new State());

    this.onMessage("move", (client, data) => {
      console.log("GameRoom: received message from", client.sessionId, ":", data);
      this.state.world?.movePlayer(client.sessionId, data);
    });

    this.setSimulationInterval((deltaTime) => this.state.world.update(deltaTime));
  }

  onAuth(client, options, req) {
    // console.log(req.headers.cookie);
    return true;
  }

  onJoin(client: Client) {
    this.state.world?.createPlayer(client.sessionId);
  }

  onLeave(client) {
    this.state.world?.removePlayer(client.sessionId);
  }

  onDispose() {
    console.log("GameRoom: Disposed");
  }
}
