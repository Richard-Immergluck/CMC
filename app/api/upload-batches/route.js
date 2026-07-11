import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod,
  requireTrustedRouteOrigin
} from '../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../lib/server/route-auth'
import { requireTrackUploadPermission } from '../../../lib/server/permissions.mjs'
import { createRouteTelemetry } from '../../../lib/server/route-telemetry'
import {
  createUploadBatch,
  listUserUploadBatches,
  serializeUploadBatch
} from '../../../lib/server/upload-batches.mjs'
import {
  createUploadBatchBodySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

const routePath = '/api/upload-batches'
const methodNotAllowed = createMethodNotAllowedHandler(['GET', 'POST'])

export async function GET(request) {
  const telemetry = createRouteTelemetry({
    request,
    route: routePath,
    event: 'upload_batches.list'
  })

  try {
    requireRouteMethod(request, ['GET', 'POST'])
    const user = await requireRouteCurrentUser({
      route: routePath
    })
    requireTrackUploadPermission(user)
    const batches = await listUserUploadBatches({
      userId: user.id
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      batchCount: batches.length
    })

    return jsonResponse(200, {
      batches: batches.map(serializeUploadBatch)
    })
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export async function POST(request) {
  const telemetry = createRouteTelemetry({
    request,
    route: routePath,
    event: 'upload_batches.create'
  })

  try {
    requireRouteMethod(request, ['GET', 'POST'])
    requireTrustedRouteOrigin(request)
    const user = await requireRouteCurrentUser({
      route: routePath
    })
    requireTrackUploadPermission(user)
    const body = await parseRouteJson(request)
    const input = validateInput(
      createUploadBatchBodySchema,
      body,
      'Invalid upload batch request'
    )
    const batch = await createUploadBatch({
      input,
      user
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      batchId: batch.id
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
  methodNotAllowed as PATCH,
  methodNotAllowed as PUT
}
