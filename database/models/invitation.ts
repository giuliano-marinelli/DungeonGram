import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  accepted: { type: Boolean, default: null },
  date: Date
});

//omit the __v when returning a invitation
invitationSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  }
});

const Invitation = mongoose.model('Invitation', invitationSchema);

export default Invitation;
