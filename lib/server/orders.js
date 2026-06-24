import prisma from './prisma'
import { auditActions, buildAuditEventData } from './audit-core.mjs'
import {
  buildOrderItems,
  calculateOrderTotal,
  ensureAllTracksFound,
  ensureNotAlreadyOwned,
  normalizeTrackIds
} from './orders-core.mjs'

export const createPendingOrder = async ({ user, trackIds }) => {
  const uniqueTrackIds = normalizeTrackIds(trackIds)

  const tracks = await prisma.track.findMany({
    where: {
      id: {
        in: uniqueTrackIds
      }
    }
  })

  ensureAllTracksFound({
    requestedTrackIds: uniqueTrackIds,
    tracks
  })

  const existingPurchases = await prisma.trackOwner.findMany({
    where: {
      userId: user.id,
      trackId: {
        in: uniqueTrackIds
      }
    }
  })

  ensureNotAlreadyOwned(existingPurchases)

  const items = buildOrderItems(tracks)
  const amountTotal = calculateOrderTotal(items)

  return prisma.order.create({
    data: {
      userId: user.id,
      amountTotal,
      currency: 'gbp',
      items: {
        create: items
      }
    },
    include: {
      items: true
    }
  })
}

export const markOrderCheckoutSession = ({ orderId, checkoutSessionId }) => {
  return prisma.order.update({
    where: {
      id: orderId
    },
    data: {
      stripeCheckoutSession: checkoutSessionId
    }
  })
}

export const fulfilPaidOrder = async ({ checkoutSessionId, paymentIntentId }) => {
  return prisma.$transaction(async tx => {
    const order = await tx.order.findUnique({
      where: {
        stripeCheckoutSession: checkoutSessionId
      },
      include: {
        items: true
      }
    })

    if (!order) {
      throw new Error(`Order not found for checkout session ${checkoutSessionId}`)
    }

    if (order.status === 'PAID') {
      return order
    }

    await tx.order.update({
      where: {
        id: order.id
      },
      data: {
        status: 'PAID',
        stripePaymentIntent: paymentIntentId || undefined
      }
    })

    for (const item of order.items) {
      await tx.trackOwner.upsert({
        where: {
          trackId_userId: {
            trackId: item.trackId,
            userId: order.userId
          }
        },
        update: {},
        create: {
          trackId: item.trackId,
          userId: order.userId
        }
      })

      await tx.auditEvent.create({
        data: buildAuditEventData({
          action: auditActions.ownershipGranted,
          actorId: order.userId,
          entityType: 'Track',
          entityId: item.trackId,
          metadata: {
            orderId: order.id,
            orderItemId: item.id,
            stripeCheckoutSession: checkoutSessionId,
            stripePaymentIntent: paymentIntentId || null
          }
        })
      })
    }

    return order
  })
}

export const recordPaymentEvent = async ({ stripeEvent, orderId }) => {
  try {
    return await prisma.paymentEvent.create({
      data: {
        stripeEventId: stripeEvent.id,
        type: stripeEvent.type,
        orderId,
        payload: JSON.stringify(stripeEvent)
      }
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return prisma.paymentEvent.findUnique({
        where: {
          stripeEventId: stripeEvent.id
        }
      })
    }

    throw error
  }
}

export const hasProcessedPaymentEvent = async stripeEventId => {
  const event = await prisma.paymentEvent.findUnique({
    where: {
      stripeEventId
    }
  })

  return Boolean(event)
}

export const findOrderByCheckoutSession = checkoutSessionId => {
  return prisma.order.findUnique({
    where: {
      stripeCheckoutSession: checkoutSessionId
    }
  })
}
