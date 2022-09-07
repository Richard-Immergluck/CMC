import AWS from 'aws-sdk'

AWS.config.update({
  accessKeyId: 'REACT_APP_ACCESS_ID',
  secretAccessKey: 'REACT_APP_ACCESS_KEY'
})

const S3_BUCKET = 'REACT_APP_BUCKET_NAME'
const REGION = 'REACT_APP_REGION'
const URL_EXPIRATION_TIME = 60 // in seconds

const myBucket = new AWS.S3({
  params: { Bucket: S3_BUCKET },
  region: REGION
})

function generatePreSignedPutUrl( fileName , fileType) {
  myBucket.getSignedUrl('putObject', {
      Key: fileName,
      ContentType: fileType,
      Expires: URL_EXPIRATION_TIME
  } , (err , url) => {
      return url // API Response Here
  });
}


function generatePreSignedGetUrl( fileName , fileType) {
  myBucket.getSignedUrl('getObject', {
      Key: fileName,
      ContentType: fileType,
      Expires: URL_EXPIRATION_TIME
  } , (err , url) => {
      return url // API Response Here
  });
}

const downloadAPI = async (req, res) => {
  generatePreSignedGetUrl(req)
  res.status(200).json('something')
}

export default downloadAPI
