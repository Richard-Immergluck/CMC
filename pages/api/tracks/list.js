import { handleApiError, requireMethod, sendJson } from '../../../lib/server/api'
import prisma from '../../../lib/server/prisma'
import { publicTrackWhere } from '../../../lib/server/tracks-core.mjs'

export default async function getCatalogue(req, res) {
  try {
    requireMethod(req, res, ['GET'])

    const catalogue = await prisma.track.findMany({
      where: publicTrackWhere
    })
    return sendJson(res, 200, catalogue)
  } catch (error) {
    return handleApiError(res, error, req)
  }
}
