import mongoose from 'mongoose';

const wearSchema = new mongoose.Schema({
  category:String,
  subcategory: String,
  name: String,
  color: String
});

//omit the __v when returning a wear
wearSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  }
});

const Wear = mongoose.model('Wear', wearSchema);

export default Wear;
