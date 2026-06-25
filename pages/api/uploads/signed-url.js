import {
  handleApiError,
  requireCurrentUser,
  requireMethod,
  sendJson
} from '../../../lib/server/api'
import { getSignedTrackUploadUrl } from '../../../lib/server/s3'
import { createUploadObjectKey } from '../../../lib/server/uploads.mjs'
import {
  uploadSignedUrlBodySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

export default async function handler(req, res) {
  try {
    requireMethod(req, res, ['POST'])
    await requireCurrentUser(req)

    const { fileName, contentType } = validateInput(
      uploadSignedUrlBodySchema,
      req.body,
      'Invalid upload request'
    )
    const key = createUploadObjectKey({
      fileName,
      keyPrefix: process.env.S3_KEY_PREFIX
    })
    const url = await getSignedTrackUploadUrl({
      key,
      contentType
    })

    return sendJson(res, 200, {
      key,
      url
    })
  } catch (error) {
    return handleApiError(res, error, req)
  }
}
