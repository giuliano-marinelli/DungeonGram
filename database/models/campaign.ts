import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  players: {
    type: "array",
    contains: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  private: Boolean
});

//omit the __v when returning a campaign
campaignSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  }
});

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
