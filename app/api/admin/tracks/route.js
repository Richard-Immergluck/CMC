import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  requireRouteMethod
} from '../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../lib/server/route-auth'
import {
  toTrackReviewItem,
  trackReviewInclude
} from '../../../../lib/server/admin-core.mjs'
import { requireSupportPermission } from '../../../../lib/server/permissions.mjs'
import prisma from '../../../../lib/server/prisma'

const methodNotAllowed = createMethodNotAllowedHandler(['GET'])

export async function GET(request) {
  try {
    requireRouteMethod(request, ['GET'])

    const user = await requireRouteCurrentUser()
    requireSupportPermission(user)

    const tracks = await prisma.track.findMany({
      where: {
        moderationStatus: 'PENDING'
      },
      include: trackReviewInclude,
      orderBy: [
        {
          uploadedAt: 'asc'
        }
      ],
      take: 100
    })

    return jsonResponse(200, {
      tracks: tracks.map(toTrackReviewItem)
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as PATCH,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
