import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod,
  requireTrustedRouteOrigin
} from '../../../../../lib/server/route-handlers'
import {
  createConflictError,
  createNotFoundError
} from '../../../../../lib/server/api-core.mjs'
import { requireRouteCurrentUser } from '../../../../../lib/server/route-auth'
import { buildUserAccessChangeMetadata, toUserAdminItem } from '../../../../../lib/server/admin-core.mjs'
import {
  auditActions,
  buildUserAccessDeniedMetadata
} from '../../../../../lib/server/audit-core.mjs'
import { recordAuditEvent } from '../../../../../lib/server/audit'
import {
  canUpdateUserAccess,
  requireAdminPermission
} from '../../../../../lib/server/permissions.mjs'
import prisma from '../../../../../lib/server/prisma'
import { createRouteTelemetry } from '../../../../../lib/server/route-telemetry'
import {
  adminUserUpdateBodySchema,
  validateInput
} from '../../../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['PATCH'])

export async function PATCH(request, { params }) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/admin/users/[userId]',
    event: 'admin.user_update'
  })

  try {
    requireRouteMethod(request, ['PATCH'])
    requireTrustedRouteOrigin(request)

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

    if (!canUpdateUserAccess({ actorId: admin.id, targetUserId: userId })) {
      await recordAuditEvent({
        action: auditActions.userAccessSelfUpdateDenied,
        actorId: admin.id,
        entityType: 'User',
        entityId: userId,
        metadata: buildUserAccessDeniedMetadata({
          attemptedFields: Object.keys(input),
          reason: 'self_access_update',
          route: '/api/admin/users/[userId]'
        })
      })

      throw createConflictError('Admins cannot update their own access')
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

    telemetry.complete({
      statusCode: 200,
      adminId: admin.id,
      userId
    })

    return jsonResponse(200, {
      user: toUserAdminItem(after)
    })
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as GET,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
