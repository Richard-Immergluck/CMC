import prisma from '../../../components/prisma'
import {
  createNotFoundError,
  handleApiError,
  requireMethod,
  sendJson
} from '../../../lib/server/api'
import { publicTrackWhere } from '../../../lib/server/tracks-core.mjs'
import {
  trackIdParamSchema,
  validateInput
} from '../../../lib/validation/api.mjs'

export default async function getTrackById(req, res) {
  try {
    requireMethod(req, res, ['GET'])

    const { trackId } = validateInput(trackIdParamSchema, req.query, 'Invalid track id')

    const track = await prisma.track.findFirst({
      where: {
        id: trackId,
        ...publicTrackWhere
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
