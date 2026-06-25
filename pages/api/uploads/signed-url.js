import {
  handleApiError,
  requireCurrentUser,
  requireMethod,
  sendJson
} from '../../../lib/server/api'
import { getSignedTrackUploadUrl } from '../../../lib/server/s3'
import { getOrCreateRequestId, logServerEvent } from '../../../lib/server/logging'
import { requireTrackUploadPermission } from '../../../lib/server/permissions.mjs'
import { createUploadObjectKey } from '../../../lib/server/uploads.mjs'
import {
  uploadSignedUrlBodySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

export default async function handler(req, res) {
  const requestId = getOrCreateRequestId(req)

  try {
    requireMethod(req, res, ['POST'])
    const user = await requireCurrentUser(req)
    requireTrackUploadPermission(user)

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

    logServerEvent({
      event: 'upload.signed_url_issued',
      message: 'Upload signed URL issued',
      requestId,
      metadata: {
        userId: user.id,
        contentType,
        key
      }
    })

    return sendJson(res, 200, {
      key,
      url
    })
  } catch (error) {
    return handleApiError(res, error, req)
  }
}
