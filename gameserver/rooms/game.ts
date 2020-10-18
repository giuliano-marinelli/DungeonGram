import { Room, Client } from 'colyseus';
import { Schema, type, MapSchema } from '@colyseus/schema';
import { World } from '../schemas/world';

//database models
import User from '../../database/models/user';
import Campaign from '../../database/models/campaign';

export class State extends Schema {
  @type(World)
  world = new World();
}

export class GameRoom extends Room<State> {
  clientUser: any = {};
  clientUserObj: any = {};

  onCreate(options) {
    this.roomId = 'game' + options.campaign;

    console.log('GameRoom-', this.roomId, '-: created');

    this.setState(new State());

    this.onMessage('*', (client, type, data) => {
      console.log('GameRoom-', this.roomId, '-: user', this.clientUserObj[client.sessionId].username, 'send command "' + type + '" =>', data);
      this.state.world?.execCommand(this.clientUser[client.sessionId], type, data);
    });

    this.setSimulationInterval((deltaTime) => this.state.world.update(deltaTime));
  }

  async onAuth(client: Client, options, req) {
    // console.log("auth", options);
    if (options && options.campaign && options.token) {
      const resu = await User.findByAuthorization(options.token);
      const campaign = await Campaign.findOne({
        _id: options.campaign,
        $or: [
          { owner: resu.user._id },
          { players: { $in: [resu.user._id] } }
        ]
      });
      // console.log("resu", resu);
      // console.log("campaign", campaign);

      if (campaign) {
        this.clientUser[client.sessionId] = resu.user._id.toString();
        this.clientUserObj[client.sessionId] = resu.user;
      }

      return campaign != null;
    } else {
      return false;
    }
  }

  onJoin(client: Client, options) {
    console.log('GameRoom-', this.roomId, '-: user', this.clientUserObj[client.sessionId].username, 'join');
    this.state.world?.execCommand(this.clientUser[client.sessionId], 'user', { action: 'join' });
  }

  onLeave(client: Client) {
    console.log('GameRoom-', this.roomId, '-: user', this.clientUserObj[client.sessionId].username, 'leave');
    this.state.world?.execCommand(this.clientUser[client.sessionId], 'user', { action: 'leave' });
  }

  onDispose() {
    console.log('GameRoom-', this.roomId, '-: disposed');
  }
}
