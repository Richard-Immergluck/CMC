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
import { uploadBatchStatuses } from '../../../../lib/server/upload-batches-core.mjs'

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
      auditEventCount,
      uploadBatchCount,
      submittedUploadBatchCount,
      uploadBatchesNeedingAttentionCount
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
      prisma.auditEvent.count(),
      prisma.uploadBatch.count(),
      prisma.uploadBatch.count({
        where: {
          status: uploadBatchStatuses.submitted
        }
      }),
      prisma.uploadBatch.count({
        where: {
          status: uploadBatchStatuses.partiallyFailed
        }
      })
    ])

    return jsonResponse(200, toAdminSummary({
      userCount,
      trackCount,
      pendingTrackCount,
      orderCount,
      paymentEventCount,
      auditEventCount,
      uploadBatchCount,
      submittedUploadBatchCount,
      uploadBatchesNeedingAttentionCount
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
