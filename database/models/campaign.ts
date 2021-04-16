import mongoose from 'mongoose';
import getS3 from '../aws';

import Map from '../models/map';
import Character from '../models/character';
import Invitation from '../models/invitation';

const campaignSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  // players: {
  //   type: "array",
  //   contains: {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'User'
  //   }
  // },
  private: Boolean,
  maps: {
    type: "array",
    contains: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Map'
    }
  },
  openedMap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Map'
  },
  users: [
    {
      ref: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      settings: Object,
    }
  ],
  characters: [Object],
  settings: Object,
  banner: String
});

//omit the __v and state when returning a campaign
campaignSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  }
});

//before deleteOne hook (only for query, ex: Campaign.deleteOne)
campaignSchema.pre('deleteOne', { query: true, document: false }, async function () {
  const campaign = await this.model.findOne(this.getQuery());
  await campaign._delete();
});

//before deleteMany hook (only for query, ex: Campaign.deleteMany)
campaignSchema.pre('deleteMany', { query: true, document: false }, async function () {
  const campaigns = await this.model.find(this.getQuery());
  for (const campaign of campaigns) {
    await campaign._delete();
  }
});

campaignSchema.methods._delete = async function () {
  console.log("DELETE Campaign: ", this.title);

  const s3 = getS3();
  const fs = require('fs');

  //delete invitations
  await Invitation.deleteMany({ campaign: this._id });

  //delete characters
  if (this.characters.length) {
    const characters = [];
    for (const character of this.characters) {
      characters.push(mongoose.Types.ObjectId(character.model));
    }
    await Character.deleteMany({ _id: { $in: characters } });
  }

  //delete maps
  if (this.maps.length)
    await Map.deleteMany({ _id: { $in: this.maps } });

  //delete banner file
  if (this.banner) {
    try {
      if (process.env.AWS_UPLOAD == "yes") await s3.deleteObject({ Bucket: "dungeongram", Key: this.banner.split('/').pop() }).promise();
      else fs.unlinkSync(this.banner);
    } catch (err) {
      console.log("not found file " + this.banner + " to delete");
    }
  }
}

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
