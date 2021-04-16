function getS3(): any {
  //aws s3 configuration
  const aws = require('aws-sdk');
  // aws.config.setPromisesDependency();
  aws.config.update({
    accessKeyId: process.env.AWS_ACCESSKEYID,
    secretAccessKey: process.env.AWS_SECRETACCESSKEY,
    region: process.env.AWS_REGION
  });
  return new aws.S3();
}

export default getS3;
