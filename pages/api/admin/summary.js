import {
  handleApiError,
  requireCurrentUser,
  requireMethod,
  sendJson
} from '../../../lib/server/api'
import { toAdminSummary } from '../../../lib/server/admin-core.mjs'
import { requireSupportPermission } from '../../../lib/server/permissions.mjs'
import prisma from '../../../lib/server/prisma'

export default async function handler(req, res) {
  try {
    requireMethod(req, res, ['GET'])

    const user = await requireCurrentUser(req, res)
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

    return sendJson(res, 200, toAdminSummary({
      userCount,
      trackCount,
      pendingTrackCount,
      orderCount,
      paymentEventCount,
      auditEventCount
    }))
  } catch (error) {
    return handleApiError(res, error, req)
  }
}
