import prisma from '../../../components/prisma'
import { handleApiError, requireMethod, sendJson } from '../../../lib/server/api'

export default async function getCatalogue(req, res) {
  try {
    requireMethod(req, res, ['GET'])

    const catalogue = await prisma.track.findMany()
    return sendJson(res, 200, catalogue)
  } catch (error) {
    return handleApiError(res, error)
  }
}
