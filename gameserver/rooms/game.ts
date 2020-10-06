import { Room, Client } from 'colyseus';
import { Schema, type, MapSchema } from '@colyseus/schema';
import { World } from '../schemas/world';
import { Point } from '../schemas/point';

export class State extends Schema {
  @type(World)
  world = new World();
}

export class GameRoom extends Room<State> {
  onCreate(options) {
    console.log('GameRoom: created', options);

    this.setState(new State());

    this.onMessage('*', (client, type, data) => {
      console.log('GameRoom: client', client.sessionId, 'send command "' + type + '" =>', data);
      this.state.world?.execCommand(client.sessionId, type, data);
    });

    this.setSimulationInterval((deltaTime) => this.state.world.update(deltaTime));
  }

  onAuth(client: Client, options, req) {
    // console.log(req.headers.cookie);
    return true;
  }

  onJoin(client: Client) {
    console.log('GameRoom: client', client.sessionId, 'join');
    this.state.world?.execCommand(client.sessionId, 'user', { action: 'join' });
  }

  onLeave(client: Client) {
    console.log('GameRoom: client', client.sessionId, 'leave');
    this.state.world?.execCommand(client.sessionId, 'user', { action: 'leave' });
  }

  onDispose() {
    console.log('GameRoom: disposed');
  }
}

export class Utils {
  static uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
