import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod,
  requireTrustedRouteOrigin
} from '../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../lib/server/route-auth'
import { requireTrackUploadPermission } from '../../../../lib/server/permissions.mjs'
import { createRouteTelemetry } from '../../../../lib/server/route-telemetry'
import {
  getUserUploadBatch,
  serializeUploadBatch,
  updateUploadBatch
} from '../../../../lib/server/upload-batches.mjs'
import {
  updateUploadBatchBodySchema,
  uploadBatchIdParamSchema,
  validateInput
} from '../../../../lib/validation/api.mjs'

const routePath = '/api/upload-batches/[batchId]'
const methodNotAllowed = createMethodNotAllowedHandler(['GET', 'PATCH'])

export async function GET(request, { params }) {
  const telemetry = createRouteTelemetry({
    request,
    route: routePath,
    event: 'upload_batches.detail'
  })

  try {
    requireRouteMethod(request, ['GET', 'PATCH'])
    const user = await requireRouteCurrentUser({
      route: routePath
    })
    requireTrackUploadPermission(user)
    const resolvedParams = await params
    const { batchId } = validateInput(
      uploadBatchIdParamSchema,
      resolvedParams,
      'Invalid upload batch route'
    )
    const batch = await getUserUploadBatch({
      batchId,
      userId: user.id
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      batchId
    })

    return jsonResponse(200, {
      batch: serializeUploadBatch(batch)
    })
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export async function PATCH(request, { params }) {
  const telemetry = createRouteTelemetry({
    request,
    route: routePath,
    event: 'upload_batches.update'
  })

  try {
    requireRouteMethod(request, ['GET', 'PATCH'])
    requireTrustedRouteOrigin(request)
    const user = await requireRouteCurrentUser({
      route: routePath
    })
    requireTrackUploadPermission(user)
    const resolvedParams = await params
    const { batchId } = validateInput(
      uploadBatchIdParamSchema,
      resolvedParams,
      'Invalid upload batch route'
    )
    const body = await parseRouteJson(request)
    const input = validateInput(
      updateUploadBatchBodySchema,
      body,
      'Invalid upload batch update request'
    )
    const batch = await updateUploadBatch({
      batchId,
      input,
      user
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      batchId
    })

    return jsonResponse(200, {
      batch: serializeUploadBatch(batch)
    })
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
