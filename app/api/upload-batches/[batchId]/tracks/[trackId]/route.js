import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  requireRouteMethod,
  requireTrustedRouteOrigin
} from '../../../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../../../lib/server/route-auth'
import { requireTrackUploadPermission } from '../../../../../../lib/server/permissions.mjs'
import { createRouteTelemetry } from '../../../../../../lib/server/route-telemetry'
import {
  removeFailedTrackFromUploadBatch,
  serializeUploadBatch
} from '../../../../../../lib/server/upload-batches.mjs'
import {
  uploadBatchTrackIdParamSchema,
  validateInput
} from '../../../../../../lib/validation/api.mjs'

const routePath = '/api/upload-batches/[batchId]/tracks/[trackId]'
const methodNotAllowed = createMethodNotAllowedHandler(['DELETE'])

export async function DELETE(request, { params }) {
  const telemetry = createRouteTelemetry({
    request,
    route: routePath,
    event: 'upload_batches.failed_track_remove'
  })

  try {
    requireRouteMethod(request, ['DELETE'])
    requireTrustedRouteOrigin(request)
    const user = await requireRouteCurrentUser({
      route: routePath
    })
    requireTrackUploadPermission(user)
    const resolvedParams = await params
    const { batchId, trackId } = validateInput(
      uploadBatchTrackIdParamSchema,
      resolvedParams,
      'Invalid upload batch track route'
    )
    const batch = await removeFailedTrackFromUploadBatch({
      batchId,
      trackId,
      user
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      batchId,
      trackId
    })

    return jsonResponse(200, {
      batch: serializeUploadBatch(batch),
      removedTrackId: trackId
    })
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as GET,
  methodNotAllowed as PATCH,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
