import AWS from 'aws-sdk'
import { response } from 'express'

AWS.config = new AWS.Config({
  accessKeyId: 'AKIAV66ZZX5G234R6BXM',
  secretAccessKey: '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',
  region: 'eu-west-2',
  signatureVersion: 'v4'
})

const s3 = new AWS.S3()

const PUTSignedS3URL = async fileId => {
  const signedUrlExpireSeconds = 60 * 15

  const url = await s3.getSignedUrlPromise('putObject', {
    Bucket: 'backingtrackstorage',
    Key: `preview-${fileId}.mp3`,
    ContentType: 'audio/mp3',
    Expires: signedUrlExpireSeconds
  })

  console.log(url)

  return response.json(url)
}

export default PUTSignedS3URL
