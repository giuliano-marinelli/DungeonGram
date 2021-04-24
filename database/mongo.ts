import mongoose from 'mongoose';

async function setMongo(): Promise<any> {
  let mongodbURI;
  console.log("NODE_ENV", process.env.NODE_ENV, process.env.NODE_ENV.trim() == 'test')
  if (process.env.NODE_ENV.trim() == "test") {
    mongodbURI = process.env.MONGODB_URI_TEST;
  } else {
    mongodbURI = process.env.MONGODB_URI;
  }
  mongoose.Promise = global.Promise;
  mongoose.set('useCreateIndex', true);
  mongoose.set('useNewUrlParser', true);
  mongoose.set('useFindAndModify', false);
  mongoose.set('useUnifiedTopology', true);
  // Connect to MongoDB using Mongoose
  await mongoose.connect(mongodbURI);
  console.log('Connected to MongoDB');
}

export default setMongo;
