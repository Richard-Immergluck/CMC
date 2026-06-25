import {
  createConflictError,
  createNotFoundError,
  handleApiError,
  requireCurrentUser,
  requireMethod,
  sendJson
} from '../../../../lib/server/api'
import { buildUserAccessChangeMetadata, toUserAdminItem } from '../../../../lib/server/admin-core.mjs'
import { auditActions } from '../../../../lib/server/audit-core.mjs'
import { recordAuditEvent } from '../../../../lib/server/audit'
import { requireAdminPermission } from '../../../../lib/server/permissions.mjs'
import prisma from '../../../../lib/server/prisma'
import {
  adminUserUpdateBodySchema,
  validateInput
} from '../../../../lib/validation/api.mjs'

export default async function handler(req, res) {
  try {
    requireMethod(req, res, ['PATCH'])

    const admin = await requireCurrentUser(req)
    requireAdminPermission(admin)

    const userId = Array.isArray(req.query.userId) ? req.query.userId[0] : req.query.userId
    const input = validateInput(
      adminUserUpdateBodySchema,
      req.body,
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

    return sendJson(res, 200, {
      user: toUserAdminItem(after)
    })
  } catch (error) {
    return handleApiError(res, error, req)
  }
}
