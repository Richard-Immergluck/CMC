import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  requireRouteMethod
} from '../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../lib/server/route-auth'
import { toAdminSummary } from '../../../../lib/server/admin-core.mjs'
import { requireSupportPermission } from '../../../../lib/server/permissions.mjs'
import prisma from '../../../../lib/server/prisma'

const methodNotAllowed = createMethodNotAllowedHandler(['GET'])

export async function GET(request) {
  try {
    requireRouteMethod(request, ['GET'])

    const user = await requireRouteCurrentUser()
    requireSupportPermission(user)

    const [
      userCount,
      trackCount,
      pendingTrackCount,
      orderCount,
      paymentEventCount,
      auditEventCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.track.count(),
      prisma.track.count({
        where: {
          moderationStatus: 'PENDING'
        }
      }),
      prisma.order.count(),
      prisma.paymentEvent.count(),
      prisma.auditEvent.count()
    ])

    return jsonResponse(200, toAdminSummary({
      userCount,
      trackCount,
      pendingTrackCount,
      orderCount,
      paymentEventCount,
      auditEventCount
    }))
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
