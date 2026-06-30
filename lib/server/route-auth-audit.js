import {
  auditActions,
  buildAuditEventData,
  buildAuthInactiveApiRejectedMetadata
} from './audit-core.mjs'
import { logServerEvent } from './logging'
import prisma from './prisma'

export const recordInactiveApiUserRejection = async ({
  reason = 'inactive_account',
  route,
  user
}) => {
  if (!user?.id) {
    return
  }

  await prisma.auditEvent.create({
    data: buildAuditEventData({
      action: auditActions.authInactiveApiRejected,
      actorId: user.id,
      entityType: 'User',
      entityId: user.id,
      metadata: buildAuthInactiveApiRejectedMetadata({
        accountStatus: user.accountStatus,
        reason,
        route
      })
    })
  })
}

export const safelyRecordInactiveApiUserRejection = async context => {
  try {
    await recordInactiveApiUserRejection(context)
  } catch (error) {
    logServerEvent({
      level: 'warn',
      event: 'auth.inactive_api_rejection_audit_failed',
      message: 'Failed to persist inactive-account API rejection audit event',
      metadata: {
        userId: context?.user?.id,
        route: context?.route,
        error: error.message
      }
    })
  }
}
