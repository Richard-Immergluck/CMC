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
import { bulkUpdateUploadedTrackMetadata } from '../../../../lib/server/tracks.mjs'
import {
  bulkUpdateTrackMetadataBodySchema,
  validateInput
} from '../../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['PATCH'])

export async function PATCH(request) {
  try {
    requireRouteMethod(request, ['PATCH'])
    requireTrustedRouteOrigin(request)

    const user = await requireRouteCurrentUser()
    requireTrackUploadPermission(user)
    const body = await parseRouteJson(request)
    const input = validateInput(
      bulkUpdateTrackMetadataBodySchema,
      body,
      'Invalid bulk track metadata update'
    )
    const result = await bulkUpdateUploadedTrackMetadata({
      input,
      user
    })

    return jsonResponse(200, result)
  } catch (error) {
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as GET,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
