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
import {
  profileCommentBodySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['GET', 'POST'])

export async function GET(request) {
  try {
    requireRouteMethod(request, ['GET', 'POST'])
    const user = await requireRouteCurrentUser()
    const userTracks = await prisma.trackOwner.findMany({
      where: { userId: user.id }
    })

    return jsonResponse(200, userTracks)
  } catch (error) {
    return handleRouteError(error, request)
  }
}

export async function POST(request) {
  try {
    requireRouteMethod(request, ['GET', 'POST'])
    const user = await requireRouteCurrentUser()
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

    return jsonResponse(200, newComment)
  } catch (error) {
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as PATCH,
  methodNotAllowed as PUT
}
