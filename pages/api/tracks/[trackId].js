import prisma from '../../../components/prisma'
import {
  createNotFoundError,
  createValidationError,
  handleApiError,
  requireMethod,
  sendJson
} from '../../../lib/server/api'

export default async function getTrackById(req, res) {
  try {
    requireMethod(req, res, ['GET'])

    const trackId = Number(req.query.trackId)

    if (!Number.isInteger(trackId)) {
      throw createValidationError('Invalid track id')
    }

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
    return handleApiError(res, error)
  }
}
