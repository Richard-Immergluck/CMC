import AWS from 'aws-sdk'

const requiredS3EnvVars = [
  'S3_ACCESS_ID',
  'S3_APP_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'S3_REGION'
]

const assertS3Config = () => {
  const missing = requiredS3EnvVars.filter(name => !process.env[name])

  if (missing.length > 0) {
    throw new Error(`Missing S3 configuration: ${missing.join(', ')}`)
  }
}

const getS3Client = () => {
  assertS3Config()

  return new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_ID,
    secretAccessKey: process.env.S3_APP_ACCESS_KEY,
    region: process.env.S3_REGION,
    signatureVersion: 'v4'
  })
}

export const sanitizeAttachmentFileName = fileName => {
  const fallback = 'track.mp3'

  if (typeof fileName !== 'string') {
    return fallback
  }

  const sanitized = fileName
    .replace(/[\r\n"]/g, '')
    .replace(/[\\/]/g, '-')
    .replace(/[^\w .()-]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)

  return sanitized || fallback
}

export const getSignedTrackUrl = ({ key, expires = 900, fileName }) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Expires: expires
  }

  if (fileName) {
    params.ResponseContentDisposition = `attachment; filename="${sanitizeAttachmentFileName(fileName)}"`
  }

  return getS3Client().getSignedUrl('getObject', params)
}

export const getSignedTrackUploadUrl = async ({ key, contentType }) => {
  return getS3Client().getSignedUrlPromise('putObject', {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Expires: 60 * 15
  })
}
