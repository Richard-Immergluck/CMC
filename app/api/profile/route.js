import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod
} from '../../../lib/server/route-handlers'
import { createForbiddenError } from '../../../lib/server/api-core.mjs'
import { requireRouteCurrentUser } from '../../../lib/server/route-auth'
import prisma from '../../../lib/server/prisma'
import { enforceRouteRateLimit } from '../../../lib/server/rate-limit'
import { createRouteTelemetry } from '../../../lib/server/route-telemetry'
import {
  profileCommentBodySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['GET', 'POST'])

export async function GET(request) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/profile',
    event: 'profile.ownership'
  })

  try {
    requireRouteMethod(request, ['GET', 'POST'])
    const user = await requireRouteCurrentUser()
    const userTracks = await prisma.trackOwner.findMany({
      where: { userId: user.id }
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      trackCount: userTracks.length
    })

    return jsonResponse(200, userTracks)
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export async function POST(request) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/profile',
    event: 'profile.comment'
  })

  try {
    requireRouteMethod(request, ['GET', 'POST'])
    const user = await requireRouteCurrentUser()
    enforceRouteRateLimit({
      request,
      scope: 'profile.comment',
      userId: user.id,
      limit: 30,
      windowMs: 5 * 60 * 1000,
      audit: {
        actorId: user.id,
        route: '/api/profile'
      }
    })
    const body = await parseRouteJson(request)
    const { trackId, comment } = validateInput(
      profileCommentBodySchema,
      body,
      'Invalid comment request'
    )

    const ownership = await prisma.trackOwner.findUnique({
      where: {
        trackId_userId: {
          trackId,
          userId: user.id
        }
      }
    })

    if (!ownership) {
      throw createForbiddenError('Track ownership required to comment')
    }

    const newComment = await prisma.comment.create({
      data: {
        content: comment,
        postedBy: {
          connect: {
            id: user.id
          }
        },
        track: {
          connect: {
            id: trackId
          }
        }
      }
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      trackId,
      commentId: newComment.id
    })

    return jsonResponse(200, newComment)
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
