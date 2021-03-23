import { Room, Client } from 'colyseus';
import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';
//schemas
import { World } from '../schemas/world';
import { User } from '../schemas/user';
import { Character } from '../schemas/character';
import { Wall } from '../schemas/wall';
import { Door } from '../schemas/door';
import { TileMap } from '../schemas/tilemap';
import { Tile } from '../schemas/tile';
import { Rule } from '../schemas/rule';
import { Figure } from '../schemas/figure';
import { Path } from '../schemas/path';
import { Wear } from '../schemas/wear';
import { Point } from '../schemas/point';
import { Utils } from '../utils';
//physics
import { EntityPhysics } from '../physics/entity.physics';
import { WorldPhysics } from '../physics/world.physics';
import { CharacterPhysics } from '../physics/character.physics';
import { WallPhysics } from '../physics/wall.physics';

//database models
import { default as UserDB } from '../../database/models/user';
import { default as CampaignDB } from '../../database/models/campaign';

//serializer
import * as serialijse from "serialijse";

import mongoose from 'mongoose';

export class State extends Schema {
  @type(World)
  world = new World();
}

export class GameRoom extends Room<State> {
  campaignId: string;
  clientUser: any = {};
  clientUserObj: any = {};

  onCreate(options) {
    this.campaignId = options.campaign;
    this.roomId = 'game' + options.campaign;

    console.log('GameRoom-', this.roomId, '-: created');

    this.setState(new State());
    this.state.world.load(this.campaignId);

    this.onMessage('*', (client, type, data) => {
      console.log('GameRoom-', this.roomId, '-: user', this.clientUserObj[client.sessionId].username, 'send command "' + type + '" =>', data);
      data.roomRef = this;
      this.state.world?.execCommand(this.clientUser[client.sessionId], type, data);
    });

    this.setSimulationInterval((deltaTime) => this.state.world.update(deltaTime));
  }

  async onAuth(client: Client, options, req) {
    // console.log("auth", options);
    if (options && options.campaign && options.token) {
      const resu = await UserDB.findByAuthorization(options.token);

      //old way with players array (that was deprecated)
      // const campaign = await CampaignDB.findOne({
      //   _id: options.campaign,
      //   $or: [
      //     { owner: resu.user._id },
      //     { players: { $in: [resu.user._id] } }
      //   ]
      // });

      //new way using the invitations
      //(check if user has an accepted invitation on this campaign or if is the owner)
      const campaigns = await CampaignDB.aggregate([
        {
          $lookup: {
            from: "invitations",
            localField: "_id",
            foreignField: "campaign",
            as: "invitations"
          }
        },
        {
          $match: {
            _id: mongoose.Types.ObjectId(options.campaign),
            $or: [
              { owner: resu.user._id },
              { invitations: { $elemMatch: { recipient: resu.user._id, accepted: true } } }
            ]
          }
        }
      ]);
      const campaign = campaigns[0];

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

  async onDispose() {
    console.log('GameRoom-', this.roomId, '-: disposed');

    //persist actual world before dispose room
    this.state.world?.persist();

    // console.log('GameRoom-', this.roomId, '-: saving world state');
    // const campaign = await CampaignDB.findOne({ _id: this.campaignId });

    //serialization
    // this.declarePersistableClasses();
    // campaign.state = serialijse.serialize(this.state);
    // console.log(this.state);

    // await CampaignDB.findOneAndUpdate({ _id: this.campaignId }, campaign);
    // console.log('GameRoom-', this.roomId, '-: finish saving state');
  }

  //NOT USED
  declarePersistableClasses() {
    //colyseus types
    serialijse.declarePersistable(Schema);
    serialijse.declarePersistable(MapSchema);
    serialijse.declarePersistable(ArraySchema);
    serialijse.declarePersistable(type);


    //schemas types
    serialijse.declarePersistable(State);
    serialijse.declarePersistable(World);
    serialijse.declarePersistable(User);
    serialijse.declarePersistable(Character);
    serialijse.declarePersistable(Wall);
    serialijse.declarePersistable(Door);
    serialijse.declarePersistable(TileMap);
    serialijse.declarePersistable(Tile);
    serialijse.declarePersistable(Rule);
    serialijse.declarePersistable(Figure);
    serialijse.declarePersistable(Path);
    serialijse.declarePersistable(Wear);
    serialijse.declarePersistable(Point);
    serialijse.declarePersistable(Utils);

    //physics types
    serialijse.declarePersistable(EntityPhysics);
    serialijse.declarePersistable(WorldPhysics);
    serialijse.declarePersistable(CharacterPhysics);
    serialijse.declarePersistable(WallPhysics);
  }
}
