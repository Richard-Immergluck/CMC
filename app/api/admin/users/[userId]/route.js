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
} from '../../../../../lib/server/api-core.mjs'
import { requireRouteCurrentUser } from '../../../../../lib/server/route-auth'
import { toUserAdminItem } from '../../../../../lib/server/admin-core.mjs'
import { applyDirectUserAccessUpdate } from '../../../../../lib/server/admin-access-requests'
import {
  auditActions,
  buildUserAccessDeniedMetadata
} from '../../../../../lib/server/audit-core.mjs'
import { recordAuditEvent } from '../../../../../lib/server/audit'
import {
  canUpdateUserAccess,
  requireAdminPermission
} from '../../../../../lib/server/permissions.mjs'
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

    const result = await applyDirectUserAccessUpdate({
      actorId: admin.id,
      targetUserId: userId,
      input
    })

    telemetry.complete({
      statusCode: result.requiresReview ? 202 : 200,
      adminId: admin.id,
      userId,
      requiresReview: result.requiresReview
    })

    return jsonResponse(result.requiresReview ? 202 : 200, {
      user: toUserAdminItem(result.user),
      ...(result.requiresReview
        ? {
            requiresReview: true,
            accessChangeRequest: result.accessChangeRequest
          }
        : {})
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
