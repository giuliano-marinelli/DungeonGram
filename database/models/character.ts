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

//before deleteOne hook (only for query, ex: Character.deleteOne)
characterSchema.pre('deleteOne', { query: true, document: false }, async function () {
  const character = await this.model.findOne(this.getQuery());
  await character._delete();
});

//before deleteMany hook (only for query, ex: Character.deleteMany)
characterSchema.pre('deleteMany', { query: true, document: false }, async function () {
  const characters = await this.model.find(this.getQuery());
  for (const character of characters) {
    await character._delete();
  }
});

characterSchema.methods._delete = async function () {
  console.log("DELETE Character: ", this.name);
}

const Character = mongoose.model('Character', characterSchema);

export default Character;
