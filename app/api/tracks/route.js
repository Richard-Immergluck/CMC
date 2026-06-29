import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod
} from '../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../lib/server/route-auth'
import { requireTrackUploadPermission } from '../../../lib/server/permissions.mjs'
import { createRouteTelemetry } from '../../../lib/server/route-telemetry'
import { createUploadedTrack } from '../../../lib/server/tracks.mjs'
import {
  createTrackBodySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['POST'])

export async function POST(request) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/tracks',
    event: 'track.create'
  })

  try {
    requireRouteMethod(request, ['POST'])

    const user = await requireRouteCurrentUser()
    requireTrackUploadPermission(user)
    const body = await parseRouteJson(request)
    const input = validateInput(createTrackBodySchema, body, 'Invalid track upload request')
    const track = await createUploadedTrack({
      input,
      user
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      trackId: track.id
    })

    return jsonResponse(200, track)
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
