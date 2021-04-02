import mongoose from 'mongoose';

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

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
