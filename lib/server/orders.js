import prisma from './prisma'
import { auditActions, buildAuditEventData } from './audit-core.mjs'
import {
  buildReleaseOrderItems,
  buildOwnershipGrantData,
  buildOrderItems,
  calculateOrderTotal,
  ensureAllReleasesFound,
  ensureAllTracksFound,
  ensureCartHasItems,
  ensureNoDuplicateOrderTracks,
  ensureNotAlreadyOwned,
  normalizeReleaseIds,
  normalizeTrackIds
} from './orders-core.mjs'
import { pricingReviewStatuses } from '../pricing-policy.mjs'

const publicPurchasableTrackWhere = {
  moderationStatus: 'APPROVED',
  processingStatus: 'READY',
  status: 'PUBLISHED'
}

const publicPurchasableReleaseWhere = {
  pricingReviewStatus: {
    in: [
      pricingReviewStatuses.autoApproved,
      pricingReviewStatuses.approved
    ]
  },
  tracks: {
    every: {
      track: {
        is: publicPurchasableTrackWhere
      }
    },
    some: {
      track: {
        is: publicPurchasableTrackWhere
      }
    }
  }
}

export const createPendingOrder = async ({ user, trackIds = [], releaseIds = [] }) => {
  const uniqueTrackIds = trackIds.length > 0 ? normalizeTrackIds(trackIds) : []
  const uniqueReleaseIds = releaseIds.length > 0 ? normalizeReleaseIds(releaseIds) : []

  ensureCartHasItems({
    releaseIds: uniqueReleaseIds,
    trackIds: uniqueTrackIds
  })

  const tracks = await prisma.track.findMany({
    where: {
      id: {
        in: uniqueTrackIds
      },
      ...publicPurchasableTrackWhere
    }
  })

  ensureAllTracksFound({
    requestedTrackIds: uniqueTrackIds,
    tracks
  })

  const releases = uniqueReleaseIds.length > 0
    ? await prisma.catalogueRelease.findMany({
        where: {
          id: {
            in: uniqueReleaseIds
          },
          ...publicPurchasableReleaseWhere
        },
        include: {
          tracks: {
            include: {
              track: true
            },
            orderBy: {
              position: 'asc'
            }
          }
        }
      })
    : []

  ensureAllReleasesFound({
    requestedReleaseIds: uniqueReleaseIds,
    releases
  })

  const orderTrackIds = [
    ...uniqueTrackIds,
    ...releases.flatMap(release => release.tracks.map(item => item.track.id))
  ]

  const existingPurchases = await prisma.trackOwner.findMany({
    where: {
      userId: user.id,
      trackId: {
        in: orderTrackIds
      }
    }
  })

  ensureNotAlreadyOwned(existingPurchases)

  const items = [
    ...buildOrderItems(tracks),
    ...buildReleaseOrderItems(releases)
  ]

  ensureNoDuplicateOrderTracks(items)

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
      const ownershipGrantData = buildOwnershipGrantData({
        item,
        userId: order.userId
      })

      await tx.trackOwner.upsert({
        where: {
          trackId_userId: {
            trackId: item.trackId,
            userId: order.userId
          }
        },
        update: {
          sourceReleaseId: ownershipGrantData.sourceReleaseId,
          sourceReleaseTitle: ownershipGrantData.sourceReleaseTitle
        },
        create: ownershipGrantData
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
            sourceReleaseId: item.sourceReleaseId || null,
            sourceReleaseTitle: item.sourceReleaseTitle || null,
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
