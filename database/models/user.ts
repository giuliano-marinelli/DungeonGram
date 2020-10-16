import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true, lowercase: true, trim: true },
  password: String,
  role: String
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
    delete ret.__v;
    return ret;
  }
});

//decode the header authorization of a request in a User object (it's the actual logged user)
userSchema.statics.findByAuthorization = async function (req) {
  var authorization = req?.headers?.authorization?.split(' ')[1];
  try {
    var decoded = jwt.verify(authorization, process.env.SECRET_TOKEN);
    const user = await User.findOne({ _id: decoded.user._id });
    return { user: user, status: 200 };
  } catch (e) {
    return { status: 401 };
  }
}

const User = mongoose.model('User', userSchema);

export default User;
