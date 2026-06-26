import {
  toAuditEventAdminItem,
  toOrderAdminItem,
  toPaymentEventAdminItem
} from './admin-core.mjs'
import prisma from './prisma'

export const getAdminOperationsData = async () => {
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
      include: {
        actor: true
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
    auditEvents: auditEvents.map(toAuditEventAdminItem)
  }
}
