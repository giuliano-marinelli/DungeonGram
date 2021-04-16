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

//before deleteOne hook (only for query, ex: Invitation.deleteOne)
invitationSchema.pre('deleteOne', { query: true, document: false }, async function () {
  const invitation = await this.model.findOne(this.getQuery());
  await invitation._delete();
});

//before deleteMany hook (only for query, ex: Invitation.deleteMany)
invitationSchema.pre('deleteMany', { query: true, document: false }, async function () {
  const invitations = await this.model.find(this.getQuery());
  for (const invitation of invitations) {
    await invitation._delete();
  }
});

invitationSchema.methods._delete = async function () {
  console.log("DELETE Invitation: ", this._id);
}

const Invitation = mongoose.model('Invitation', invitationSchema);

export default Invitation;
