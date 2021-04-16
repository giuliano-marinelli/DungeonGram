import mongoose from 'mongoose';
import getS3 from '../aws';

import Campaign from '../models/campaign';

const mapSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  walls: {
    type: "array",
    contains: {
      from: {
        x: Number,
        y: Number
      },
      to: {
        x: Number,
        y: Number
      },
      defaultTo: {
        x: Number,
        y: Number
      },
      size: String,
      type: String,
      blocked: Boolean,
      hidden: Boolean
    }
  },
  // characters: [
  //   {
  //     position: {
  //       x: Number,
  //       y: Number
  //     },
  //     direction: {
  //       x: Number,
  //       y: Number
  //     },
  //     name: String,
  //     group: String,
  //     visionRange: Number,
  //     model: {
  //       type: mongoose.Schema.Types.ObjectId,
  //       ref: 'Character'
  //     }
  //   }
  // ],
  tilemap: {
    width: Number,
    height: Number,
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset'
    },
  },
  imageUrl: String,
  private: Boolean,
  terrain: String
});

//omit the __v when returning a map
mapSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  }
});

//before deleteOne hook (only for query, ex: Map.deleteOne)
mapSchema.pre('deleteOne', { query: true, document: false }, async function () {
  const map = await this.model.findOne(this.getQuery());
  await map._delete();
});

//before deleteMany hook (only for query, ex: Map.deleteMany)
mapSchema.pre('deleteMany', { query: true, document: false }, async function () {
  const maps = await this.model.find(this.getQuery());
  for (const map of maps) {
    await map._delete();
  }
});

mapSchema.methods._delete = async function () {
  console.log("DELETE Map: ", this.name);

  const s3 = getS3();
  const fs = require('fs');

  //delete references to map on campaigns
  await Campaign.update(
    { maps: { $in: [this._id] } },
    { $pullAll: { maps: [this._id] } }
  );

  //delete references to map on campaigns characters
  await Campaign.update(
    { 'characters.map': this._id },
    { $set: { "characters.$.map": null } }
  );

  //delete terrain file
  if (this.terrain) {
    try {
      if (process.env.AWS_UPLOAD == "yes") await s3.deleteObject({ Bucket: "dungeongram", Key: this.terrain.split('/').pop() }).promise();
      else fs.unlinkSync(this.terrain);
    } catch (err) {
      console.log("not found file " + this.terrain + " to delete");
    }
  }
}

const Map = mongoose.model('Map', mapSchema);

export default Map;
