import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  requireRouteMethod
} from '../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../lib/server/route-auth'
import { requireSupportPermission } from '../../../../lib/server/permissions.mjs'
import prisma from '../../../../lib/server/prisma'
import { toUploadBatchAdminItem } from '../../../../lib/server/admin-core.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['GET'])

export async function GET(request) {
  try {
    requireRouteMethod(request, ['GET'])

    const user = await requireRouteCurrentUser()
    requireSupportPermission(user)

    const uploadBatches = await prisma.uploadBatch.findMany({
      include: {
        _count: {
          select: {
            tracks: true
          }
        },
        tracks: {
          orderBy: {
            uploadedAt: 'desc'
          },
          select: {
            id: true,
            title: true,
            status: true,
            moderationStatus: true,
            processingStatus: true,
            uploadedAt: true
          }
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    })

    return jsonResponse(200, {
      uploadBatches: uploadBatches.map(toUploadBatchAdminItem)
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
