import mongoose from 'mongoose';

const characterSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  wears: [
    {
      category: String,
      subcategory: String,
      name: String,
      color: String
    }
  ],
  height: Number,
  visionRange: Number,
  private: Boolean,
  portrait: String,
  facePortrait: String,
  copyOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Character' }
});

//omit the __v when returning a character
characterSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  }
});

const Character = mongoose.model('Character', characterSchema);

export default Character;
