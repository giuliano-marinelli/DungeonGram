import { Client, Room } from "colyseus";
import { Roll } from '../schemas/roll';

//database models
import User from '../../database/models/user';
import Campaign from '../../database/models/campaign';

import mongoose from 'mongoose';

export class ChatRoom extends Room {
  clientUser: any = {};
  clientUserObj: any = {};

  onCreate(options) {
    this.roomId = 'chat' + options.campaign;

    console.log('ChatRoom-', this.roomId, '-: created');

    this.onMessage("message", (client, message) => {
      console.log('ChatRoom-', this.roomId, '-: client', this.clientUserObj[client.sessionId].username, 'send message =>', message);
      var roll = new Roll(message);
      console.log(roll);
      this.broadcast("messages", '<b>' + this.clientUserObj[client.sessionId].username + '</b> ' +
        (roll.isRoll
          ? 'rolling ' + roll.rolls.join(' + ') + '<br>' + (roll.getSum() + ' = ' + roll.getValue())
          : message ? message : ""
        ));
    });
  }

  async onAuth(client: Client, options, req) {
    // console.log("auth", options);
    if (options && options.campaign && options.token) {
      const resu = await User.findByAuthorization(options.token);
      //old way with players array (that was deprecated)
      // const campaign = await Campaign.findOne({
      //   _id: options.campaign,
      //   $or: [
      //     { owner: resu.user._id },
      //     { players: { $in: [resu.user._id] } }
      //   ]
      // });

      //new way using the invitations
      //(check if user has an accepted invitation on this campaign or if is the owner)
      const campaigns = await Campaign.aggregate([
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

  onJoin(client) {
    console.log('ChatRoom-', this.roomId, '-: user', this.clientUserObj[client.sessionId].username, 'join');
    this.broadcast("messages", `<b>${this.clientUserObj[client.sessionId].username}</b> joined.`);
  }

  onLeave(client) {
    console.log('ChatRoom-', this.roomId, '-: user', this.clientUserObj[client.sessionId].username, 'leave');
    this.broadcast("messages", `<b>${this.clientUserObj[client.sessionId].username}</b> left.`);
  }

  onDispose() {
    console.log('ChatRoom-', this.roomId, '-: dispose');
  }

}
