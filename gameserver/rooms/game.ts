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
    console.log("GameRoom: Created", options);

    this.setState(new State());

    this.onMessage("move", (client, data) => {
      console.log("GameRoom: received 'move' action from", client.sessionId, ":", data);
      this.state.world?.movePlayer(client.sessionId, data);
    });

    this.onMessage("dragPlayer", (client, data) => {
      console.log("GameRoom: received 'dragPlayer' action from", client.sessionId, ":", data);
      this.state.world?.dragPlayer(client.sessionId, data);
    });

    this.onMessage("tilemap", (client, data) => {
      console.log("GameRoom: received 'tilemap' action from", client.sessionId, ":", data);
      if (data.action == 'resize')
        this.state.world?.tilemap?.changeSize(data.width, data.height);
      else if (data.action == 'show')
        this.state.world.setTilemapShowGrid(client.sessionId, data.value);
    });

    this.onMessage("wall", (client, data) => {
      console.log("GameRoom: received 'wall' action from", client.sessionId, ":", data);
      if (data.action == 'start')
        this.state.world.wallFirstPoint = new Point(data.x, data.y);
      else if (data.action == 'end')
        this.state.world.createWall(new Point(data.x, data.y));
      else if (data.action == 'remove')
        this.state.world.removeWall(data.id);
      else if (data.action == 'visibility')
        this.state.world.setWallVisibility(client.sessionId, data.value);
      else if (data.action == 'pickable')
        this.state.world.setWallPickable(client.sessionId, data.value);
    });

    this.onMessage("fogOfWar", (client, data) => {
      console.log("GameRoom: received 'fogOfWar' action from", client.sessionId, ":", data);
      if (data.action == 'visibility')
        this.state.world.setFogOfWarVisibility(client.sessionId, data.value);
    });

    this.onMessage("rule", (client, data) => {
      console.log("GameRoom: received 'rule' action from", client.sessionId, ":", data);
      if (data.action == 'start')
        this.state.world.startRule(client.sessionId, new Point(data.x, data.y));
      else if (data.action == 'move')
        this.state.world.moveRule(client.sessionId, new Point(data.x, data.y));
      else if (data.action == 'add')
        this.state.world.addRule(client.sessionId, new Point(data.x, data.y));
      else if (data.action == 'end')
        this.state.world.endRule(client.sessionId);
    });

    this.setSimulationInterval((deltaTime) => this.state.world.update(deltaTime));
  }

  onAuth(client: Client, options, req) {
    // console.log(req.headers.cookie);
    return true;
  }

  onJoin(client: Client) {
    this.state.world?.createUser(client.sessionId);
    this.state.world?.createPlayer(client.sessionId);
  }

  onLeave(client: Client) {
    this.state.world?.removeUser(client.sessionId);
    this.state.world?.removePlayer(client.sessionId);
  }

  onDispose() {
    console.log("GameRoom: Disposed");
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
