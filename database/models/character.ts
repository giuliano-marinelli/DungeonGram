import mongoose from 'mongoose';
import getS3 from '../aws';

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
  copyOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
  mode2D: Boolean,
  disableBack: Boolean,
  frontImage: String,
  backImage: String
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

  //delete front image file
  Character.deleteFiles(this.frontImage);

  //delete back image file
  Character.deleteFiles(this.backImage);
}

characterSchema.statics.deleteFiles = async function (image, attribute) {
  try {
    if (image) {
      const query = {};
      query[attribute] = image;
      const sameImageCharacters = await Character.find(query);

      if (!sameImageCharacters || sameImageCharacters.length <= 1) {
        const s3 = getS3();
        const fs = require('fs');

        try {
          if (process.env.NODE_ENV.trim() == "test") fs.unlinkSync(image);
          else await s3.deleteObject({ Bucket: "dungeongram", Key: image.split('/').pop() }).promise();
        } catch (err) {
          console.log("Not found file " + image + " to delete");
        }
      }
    }
  } catch {
    console.log("Failed to delete " + image + " file");
  }
}

const Character = mongoose.model('Character', characterSchema);

export default Character;
