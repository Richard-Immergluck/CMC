import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod,
  requireTrustedRouteOrigin
} from '../../../lib/server/route-handlers'
import { createNotFoundError } from '../../../lib/server/api-core.mjs'
import { requireRouteCurrentUser } from '../../../lib/server/route-auth'
import prisma from '../../../lib/server/prisma'
import { enforceRouteRateLimit } from '../../../lib/server/rate-limit'
import { getTrackRequestExpiry } from '../../../lib/server/request-responses.mjs'
import { createRouteTelemetry } from '../../../lib/server/route-telemetry'
import { publicTrackWhere } from '../../../lib/server/tracks-core.mjs'
import {
  trackRequestBodySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['POST'])

export async function POST(request) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/track-requests',
    event: 'track_request.create'
  })

  try {
    requireRouteMethod(request, ['POST'])
    requireTrustedRouteOrigin(request)
    const user = await requireRouteCurrentUser()
    await enforceRouteRateLimit({
      request,
      scope: 'track_request.create',
      userId: user.id,
      limit: 20,
      windowMs: 5 * 60 * 1000,
      audit: {
        actorId: user.id,
        route: '/api/track-requests'
      }
    })

    const body = await parseRouteJson(request)
    const input = validateInput(
      trackRequestBodySchema,
      body,
      'Invalid track request'
    )
    const track = await prisma.track.findFirst({
      where: {
        id: input.trackId,
        ...publicTrackWhere
      },
      select: {
        id: true,
        title: true,
        composer: true,
        instrumentation: true
      }
    })

    if (!track) {
      throw createNotFoundError('Track not found')
    }

    const createdRequest = await prisma.trackRequest.create({
      data: {
        trackId: track.id,
        userId: user.id,
        title: input.title,
        composer: track.composer,
        expiresAt: getTrackRequestExpiry(new Date()),
        instrumentation: track.instrumentation,
        notes: input.notes || null
      }
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      trackId: track.id,
      requestId: createdRequest.id
    })

    return jsonResponse(200, createdRequest)
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
