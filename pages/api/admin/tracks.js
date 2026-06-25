import {
  handleApiError,
  requireCurrentUser,
  requireMethod,
  sendJson
} from '../../../lib/server/api'
import { toTrackReviewItem } from '../../../lib/server/admin-core.mjs'
import { requireSupportPermission } from '../../../lib/server/permissions.mjs'
import prisma from '../../../lib/server/prisma'

export default async function handler(req, res) {
  try {
    requireMethod(req, res, ['GET'])

    const user = await requireCurrentUser(req, res)
    requireSupportPermission(user)

    const tracks = await prisma.track.findMany({
      where: {
        moderationStatus: 'PENDING'
      },
      include: {
        uploadedBy: true
      },
      orderBy: [
        {
          uploadedAt: 'asc'
        }
      ],
      take: 100
    })

    return sendJson(res, 200, {
      tracks: tracks.map(toTrackReviewItem)
    })
  } catch (error) {
    return handleApiError(res, error, req)
  }
}
