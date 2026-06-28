import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  requireRouteMethod
} from '../../../../lib/server/route-handlers'
import { createNotFoundError } from '../../../../lib/server/api-core.mjs'
import prisma from '../../../../lib/server/prisma'
import { publicTrackWhere } from '../../../../lib/server/tracks-core.mjs'
import {
  trackIdParamSchema,
  validateInput
} from '../../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['GET'])

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

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as PATCH,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
