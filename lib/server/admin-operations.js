import {
  toAuditEventQueryOptions,
  toAuditEventAdminItem,
  toOrderAdminItem,
  toPaymentEventAdminItem
} from './admin-core.mjs'
import prisma from './prisma'

export const getAdminOperationsData = async ({ audit = {} } = {}) => {
  const auditQueryOptions = toAuditEventQueryOptions(audit)

  const [orders, paymentEvents, auditEvents] = await Promise.all([
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
    })
  ])

  return {
    orders: orders.map(toOrderAdminItem),
    paymentEvents: paymentEvents.map(toPaymentEventAdminItem),
    auditEvents: auditEvents.map(toAuditEventAdminItem)
  }
}
