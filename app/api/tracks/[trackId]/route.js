import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod,
  requireTrustedRouteOrigin
} from '../../../../lib/server/route-handlers'
import { createNotFoundError } from '../../../../lib/server/api-core.mjs'
import { requireRouteCurrentUser } from '../../../../lib/server/route-auth'
import { requireTrackUploadPermission } from '../../../../lib/server/permissions.mjs'
import prisma from '../../../../lib/server/prisma'
import { publicTrackWhere } from '../../../../lib/server/tracks-core.mjs'
import { updateUploadedTrackMetadata } from '../../../../lib/server/tracks.mjs'
import {
  trackIdParamSchema,
  updateTrackMetadataBodySchema,
  validateInput
} from '../../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['GET', 'PATCH'])

export async function GET(request, { params }) {
  try {
    requireRouteMethod(request, ['GET'])

    const routeParams = await params
    const { trackId } = validateInput(trackIdParamSchema, routeParams, 'Invalid track id')
    const track = await prisma.track.findFirst({
      where: {
        id: trackId,
        ...publicTrackWhere
      }
    })

    if (!track) {
      throw createNotFoundError('Track not found')
    }

    return jsonResponse(200, track)
  } catch (error) {
    return handleRouteError(error, request)
  }
}

export async function PATCH(request, { params }) {
  try {
    requireRouteMethod(request, ['PATCH'])
    requireTrustedRouteOrigin(request)

    const user = await requireRouteCurrentUser()
    requireTrackUploadPermission(user)
    const routeParams = await params
    const { trackId } = validateInput(trackIdParamSchema, routeParams, 'Invalid track id')
    const body = await parseRouteJson(request)
    const input = validateInput(updateTrackMetadataBodySchema, body, 'Invalid track metadata update')
    const track = await updateUploadedTrackMetadata({
      input,
      trackId,
      user
    })

    return jsonResponse(200, track)
  } catch (error) {
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
