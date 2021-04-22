import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import getS3 from '../aws';

import Campaign from '../models/campaign';
import Map from '../models/map';
import Character from '../models/character';
import Invitation from '../models/invitation';

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true, lowercase: true, trim: true },
  password: String,
  role: String,
  avatar: String,
  verified: Boolean,
  lastVerifyDate: Date,
  verificationCode: String
});

//before saving the user, hash the password
userSchema.pre('save', function (next): void {
  const user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, (error, hash) => {
      if (error) { return next(error); }
      user.password = hash;
      next();
    });
  });
});

//compare provided password with db encrypted one
userSchema.methods.comparePassword = function (candidatePassword, callback): void {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    if (err) { return callback(err); }
    callback(null, isMatch);
  });
};

//omit the password and __v when returning a user
userSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.password;
    delete ret.verificationCode;
    delete ret.__v;
    return ret;
  }
});

//before deleteOne hook (only for query, ex: User.deleteOne)
userSchema.pre('deleteOne', { query: true, document: false }, async function () {
  const user = await this.model.findOne(this.getQuery());
  await user._delete();
});

//before deleteMany hook (only for query, ex: User.deleteMany)
userSchema.pre('deleteMany', { query: true, document: false }, async function () {
  const users = await this.model.find(this.getQuery());
  for (const user of users) {
    await user._delete();
  }
});

userSchema.methods._delete = async function () {
  console.log("DELETE User: ", this.username, this.email);

  //delete invitations
  await Invitation.deleteMany({ $or: [{ recipient: this._id }, { sender: this._id }] });

  //delete campaigns
  await Campaign.deleteMany({ owner: this._id });

  //delete characters
  await Character.deleteMany({ owner: this._id });

  //delete maps
  await Map.deleteMany({ owner: this._id });

  //delete avatar file
  User.deleteFiles(this.avatar);
}

userSchema.statics.deleteFiles = async function (avatar) {
  try {
    if (avatar) {
      const sameAvatarUsers = await User.find({ avatar: avatar });

      if (!sameAvatarUsers || sameAvatarUsers.length <= 1) {
        const s3 = getS3();
        const fs = require('fs');

        try {
          if (process.env.AWS_UPLOAD == "yes") await s3.deleteObject({ Bucket: "dungeongram", Key: avatar.split('/').pop() }).promise();
          else fs.unlinkSync(avatar);
        } catch (err) {
          console.log("Not found file " + avatar + " to delete");
        }
      }
    }
  } catch {
    console.log("Failed to delete " + avatar + " file");
  }
}

//decode the header authorization of a request in a User object (it's the actual logged user)
userSchema.statics.findByAuthorization = async function (req) {
  var authorization = req?.headers?.authorization?.split(' ')[1];
  if (!authorization) authorization = req;
  try {
    var decoded = jwt.verify(authorization, process.env.SECRET_TOKEN);
    if (!decoded?.user) return { status: 401 };

    const user = await User.findOne({ _id: decoded.user._id });
    return { user: user, status: 200 };
  } catch (e) {
    return { status: 401 };
  }
}

const User = mongoose.model('User', userSchema);

export default User;
