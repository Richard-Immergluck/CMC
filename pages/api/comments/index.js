import prisma from '../../../components/prisma'
import {
  handleApiError,
  requireMethod,
  sendJson
} from '../../../lib/server/api'
import {
  commentQuerySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

export default async function handler(req, res) {
  try {
    requireMethod(req, res, ['GET'])

    const { trackId } = validateInput(commentQuerySchema, req.query, 'Invalid track id')

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
