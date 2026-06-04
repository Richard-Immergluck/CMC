import prisma from './prisma'

const toMinorUnits = track => {
  if (Number.isInteger(track.pricePence)) {
    return track.pricePence
  }

  return Math.round(Number(track.price || 0) * 100)
}

export const createPendingOrder = async ({ user, trackIds }) => {
  const uniqueTrackIds = [...new Set(trackIds.map(Number))]

  if (
    uniqueTrackIds.length === 0 ||
    uniqueTrackIds.some(trackId => !Number.isInteger(trackId) || trackId <= 0)
  ) {
    throw new Error('Cart is empty')
  }

  const tracks = await prisma.track.findMany({
    where: {
      id: {
        in: uniqueTrackIds
      }
    }
  })

  if (tracks.length !== uniqueTrackIds.length) {
    throw new Error('One or more tracks no longer exist')
  }

  const existingPurchases = await prisma.trackOwner.findMany({
    where: {
      userId: user.id,
      trackId: {
        in: uniqueTrackIds
      }
    }
  })

  if (existingPurchases.length > 0) {
    throw new Error('One or more tracks are already owned')
  }

  const items = tracks.map(track => {
    const unitAmount = toMinorUnits(track)

    if (unitAmount <= 0) {
      throw new Error(`Track "${track.title}" does not have a valid price`)
    }

    return {
      trackId: track.id,
      title: track.title,
      composer: track.composer,
      unitAmount,
      currency: track.currency || 'gbp'
    }
  })

  const amountTotal = items.reduce((total, item) => total + item.unitAmount, 0)

  if (amountTotal <= 0) {
    throw new Error('Order total must be greater than zero')
  }

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
