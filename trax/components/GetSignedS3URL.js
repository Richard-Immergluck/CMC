import AWS from "aws-sdk"

AWS.config = new AWS.Config({
  accessKeyId: process.env.S3_ACCESS_ID,
  secretAccessKey: process.env.S3_APP_ACCESS_KEY,
  region: process.env.S3_REGION,
  signatureVersion: "v4",
});

const s3 = new AWS.S3();

const GETSignedS3URL = ({ bucket, key, expires }) => {
  const signedUrl = s3.getSignedUrl("getObject", { // s3.getSignedURL is synchronous
    Key: key,
    Bucket: bucket,
    Expires: expires || 900, // This is the S3 default value (15 minutes)
  });

  return signedUrl;
};

export default GETSignedS3URL