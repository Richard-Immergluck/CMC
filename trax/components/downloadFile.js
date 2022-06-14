import AWS from 'aws-sdk'

const s3bucket = new AWS.S3({
  accessKeyId: process.env.REACT_APP_ACCESS_ID,
  secretAccessKey: process.env.REACT_APP_SECRET_KEY,
  signatureVersion: 'v4',
  region: process.env.AREACT_APP_REGION, // ex) us-west-2
});

const params = {
  Bucket: process.env.REACT_APP_BUCKET_NAME,
  Expires: 3000,
  Key: fileName, // this key is the S3 full file path (ex: mnt/sample.txt)
};
const url = await s3bucket
  .getSignedUrlPromise('getObject', params)
  .catch((err) => {
    logger.error(err);
  });