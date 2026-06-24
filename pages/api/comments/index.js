import prisma from '../../../components/prisma'
import {
  createValidationError,
  handleApiError,
  requireMethod,
  sendJson
} from '../../../lib/server/api'

export default async function handler(req, res) {
  try {
    requireMethod(req, res, ['GET'])

    const trackId = Number(req.query.trackId)

    if (!Number.isInteger(trackId)) {
      throw createValidationError('Invalid track id')
    }

    const comments = await prisma.comment.findMany({
      where: {
        trackId
      }
    })

    return sendJson(res, 200, comments)
  } catch (error) {
    return handleApiError(res, error)
  }
}
