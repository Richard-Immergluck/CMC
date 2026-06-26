import {
  createForbiddenError,
  handleApiError,
  requireCurrentUser,
  requireMethod,
  sendJson
} from '../../../lib/server/api'
import prisma from '../../../lib/server/prisma'
import {
  profileCommentBodySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

export default async function handler(req, res) {
  try {
    requireMethod(req, res, ['GET', 'POST'])
    const user = await requireCurrentUser(req, res)

    // GET all tracks purchased by user
    if (req.method === 'GET') {
      // If user is logged in, get all tracks that have been purchased by the user
      const userTracks = await prisma.trackOwner.findMany({
        where: { userId: user.id }
      })
      return sendJson(res, 200, userTracks)
    }

    // POST a new comment to the DB
    const { trackId, comment } = validateInput(
      profileCommentBodySchema,
      req.body,
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

    // If user owns the track, upload a new comment to the DB
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
    return sendJson(res, 200, newComment)
  } catch (error) {
    return handleApiError(res, error, req)
  }
}
