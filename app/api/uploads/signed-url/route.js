import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod
} from '../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../lib/server/route-auth'
import { getSignedTrackUploadUrl } from '../../../../lib/server/s3'
import { logServerEvent } from '../../../../lib/server/logging'
import { enforceRouteRateLimit } from '../../../../lib/server/rate-limit'
import { createRouteTelemetry } from '../../../../lib/server/route-telemetry'
import { requireTrackUploadPermission } from '../../../../lib/server/permissions.mjs'
import { createUploadObjectKey } from '../../../../lib/server/uploads.mjs'
import {
  uploadSignedUrlBodySchema,
  validateInput
} from '../../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['POST'])

export async function POST(request) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/uploads/signed-url',
    event: 'upload.signed_url'
  })
  const { requestId } = telemetry

  try {
    requireRouteMethod(request, ['POST'])
    const user = await requireRouteCurrentUser()
    requireTrackUploadPermission(user)
    enforceRouteRateLimit({
      request,
      scope: 'upload.signed_url',
      userId: user.id,
      limit: 20,
      windowMs: 5 * 60 * 1000,
      audit: {
        actorId: user.id,
        route: '/api/uploads/signed-url'
      }
    })

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

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      contentType
    })

    return jsonResponse(200, {
      key,
      url
    })
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as GET,
  methodNotAllowed as PATCH,
  methodNotAllowed as PUT
}
