import mongoose from 'mongoose';

const mapSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  walls: [
    {
      from: {
        x: Number,
        y: Number
      },
      to: {
        x: Number,
        y: Number
      },
      size: String
    }
  ],
  characters: [
    {
      position: {
        x: Number,
        y: Number
      },
      visionRange: Number,
      model: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Character'
      }
    }
  ],
  tilemap: {
    width: Number,
    height: Number,
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset'
    }
  },
  private: Boolean
});

//omit the __v when returning a map
mapSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  }
});

const Map = mongoose.model('Map', mapSchema);

export default Map;
