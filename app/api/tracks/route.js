import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod
} from '../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../lib/server/route-auth'
import { requireTrackUploadPermission } from '../../../lib/server/permissions.mjs'
import { createUploadedTrack } from '../../../lib/server/tracks.mjs'
import {
  createTrackBodySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['POST'])

export async function POST(request) {
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

    return jsonResponse(200, track)
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
