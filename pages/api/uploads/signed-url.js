import { v4 as uuidv4 } from 'uuid'
import {
  handleApiError,
  requireCurrentUser,
  requireMethod,
  sendJson
} from '../../../lib/server/api'
import { getSignedTrackUploadUrl } from '../../../lib/server/s3'
import {
  uploadSignedUrlBodySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

const normalizeS3Prefix = prefix => {
  if (!prefix) {
    return ''
  }

  return prefix.replace(/^\/+/, '').replace(/\/?$/, '/')
}

export default async function handler(req, res) {
  try {
    requireMethod(req, res, ['POST'])
    await requireCurrentUser(req)

    const { fileName, contentType } = validateInput(
      uploadSignedUrlBodySchema,
      req.body,
      'Invalid upload request'
    )
    const extension = fileName.split('.').pop().toLowerCase()
    const key = `${normalizeS3Prefix(process.env.S3_KEY_PREFIX)}${uuidv4()}.${extension}`
    const url = await getSignedTrackUploadUrl({
      key,
      contentType
    })

    return sendJson(res, 200, {
      key,
      url
    })
  } catch (error) {
    return handleApiError(res, error)
  }
}
