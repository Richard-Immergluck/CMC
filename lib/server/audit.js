import prisma from './prisma'
import { buildAuditEventData } from './audit-core.mjs'

export const recordAuditEvent = ({ action, actorId, entityType, entityId, metadata }) => {
  return prisma.auditEvent.create({
    data: buildAuditEventData({
      action,
      actorId,
      entityType,
      entityId,
      metadata
    })
  })
}

