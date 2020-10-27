import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  url: String
});

//omit the __v when returning a asset
assetSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  }
});

const Asset = mongoose.model('Asset', assetSchema);

export default Asset;
