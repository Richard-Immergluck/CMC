import AWS from "aws-sdk"

AWS.config = new AWS.Config({
  accessKeyId: 'AKIAV66ZZX5G234R6BXM',
  secretAccessKey: '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',
  region: 'eu-west-2',
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