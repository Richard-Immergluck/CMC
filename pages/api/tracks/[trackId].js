import prisma from '../../../components/prisma'
import {
  createNotFoundError,
  handleApiError,
  requireMethod,
  sendJson
} from '../../../lib/server/api'
import {
  trackIdParamSchema,
  validateInput
} from '../../../lib/validation/api.mjs'

export default async function getTrackById(req, res) {
  try {
    requireMethod(req, res, ['GET'])

    const { trackId } = validateInput(trackIdParamSchema, req.query, 'Invalid track id')

    const track = await prisma.track.findUnique({
      where: {
        id: trackId
      }
    })

    if (!track) {
      throw createNotFoundError('Track not found')
    }

    return sendJson(res, 200, track)
  } catch (error) {
    return handleApiError(res, error, req)
  }
}
