import {
  createMethodNotAllowedHandler,
  getRouteRequestId,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod
} from '../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../lib/server/route-auth'
import { getSignedTrackUploadUrl } from '../../../../lib/server/s3'
import { logServerEvent } from '../../../../lib/server/logging'
import { requireTrackUploadPermission } from '../../../../lib/server/permissions.mjs'
import { createUploadObjectKey } from '../../../../lib/server/uploads.mjs'
import {
  uploadSignedUrlBodySchema,
  validateInput
} from '../../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['POST'])

export async function POST(request) {
  const requestId = getRouteRequestId(request)

  try {
    requireRouteMethod(request, ['POST'])
    const user = await requireRouteCurrentUser()
    requireTrackUploadPermission(user)

    const body = await parseRouteJson(request)
    const { fileName, contentType } = validateInput(
      uploadSignedUrlBodySchema,
      body,
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

    return jsonResponse(200, {
      key,
      url
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as GET,
  methodNotAllowed as PATCH,
  methodNotAllowed as PUT
}
