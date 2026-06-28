import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod
} from '../../../../../lib/server/route-handlers'
import {
  createConflictError,
  createNotFoundError
} from '../../../../../lib/server/api-core.mjs'
import { requireRouteCurrentUser } from '../../../../../lib/server/route-auth'
import { buildUserAccessChangeMetadata, toUserAdminItem } from '../../../../../lib/server/admin-core.mjs'
import { auditActions } from '../../../../../lib/server/audit-core.mjs'
import { recordAuditEvent } from '../../../../../lib/server/audit'
import { requireAdminPermission } from '../../../../../lib/server/permissions.mjs'
import prisma from '../../../../../lib/server/prisma'
import {
  adminUserUpdateBodySchema,
  validateInput
} from '../../../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['PATCH'])

export async function PATCH(request, { params }) {
  try {
    requireRouteMethod(request, ['PATCH'])

    const admin = await requireRouteCurrentUser()
    requireAdminPermission(admin)

    const routeParams = await params
    const userId = routeParams.userId
    const body = await parseRouteJson(request)
    const input = validateInput(
      adminUserUpdateBodySchema,
      body,
      'Invalid admin user update request'
    )

    const removesOwnAccess = admin.id === userId && (
      input.role ||
      input.accountStatus === 'SUSPENDED' ||
      input.accountStatus === 'CLOSED'
    )

    if (removesOwnAccess) {
      throw createConflictError('Admins cannot remove their own access')
    }

    const before = await prisma.user.findUnique({
      where: {
        id: userId
      }
    })

    if (!before) {
      throw createNotFoundError('User not found')
    }

    const after = await prisma.user.update({
      where: {
        id: userId
      },
      data: input
    })

    await recordAuditEvent({
      action: auditActions.userAccessUpdated,
      actorId: admin.id,
      entityType: 'User',
      entityId: userId,
      metadata: buildUserAccessChangeMetadata({
        before,
        after
      })
    })

    return jsonResponse(200, {
      user: toUserAdminItem(after)
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as GET,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
