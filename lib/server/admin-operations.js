import {
  toAuditEventQueryOptions,
  toAuditEventAdminItem,
  toOrderAdminItem,
  toPaymentEventAdminItem,
  toUserAccessChangeRequestAdminItem
} from './admin-core.mjs'
import prisma from './prisma'

export const getAdminOperationsData = async ({ audit = {} } = {}) => {
  const auditQueryOptions = toAuditEventQueryOptions(audit)

  const [orders, paymentEvents, auditEvents, accessChangeRequests] = await Promise.all([
    prisma.order.findMany({
      include: {
        user: true,
        items: true
      },
      orderBy: [
        {
          createdAt: 'desc'
        }
      ],
      take: 25
    }),
    prisma.paymentEvent.findMany({
      orderBy: [
        {
          processedAt: 'desc'
        }
      ],
      take: 25
    }),
    prisma.auditEvent.findMany({
      where: auditQueryOptions.where,
      include: {
        actor: true
      },
      orderBy: auditQueryOptions.orderBy,
      take: auditQueryOptions.take
    }),
    prisma.userAccessChangeRequest.findMany({
      include: {
        targetUser: true,
        requestedBy: true,
        reviewedBy: true
      },
      orderBy: [
        {
          createdAt: 'desc'
        }
      ],
      take: 25
    })
  ])

  return {
    orders: orders.map(toOrderAdminItem),
    paymentEvents: paymentEvents.map(toPaymentEventAdminItem),
    auditEvents: auditEvents.map(toAuditEventAdminItem),
    accessChangeRequests: accessChangeRequests.map(toUserAccessChangeRequestAdminItem)
  }
}
