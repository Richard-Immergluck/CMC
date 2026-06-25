import assert from 'node:assert/strict'
import test from 'node:test'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const enabled = process.env.CMC_RUN_INTEGRATION_TESTS === 'true'

const createClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for integration tests')
  }

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL
    })
  })
}

test('database flow creates a paid order, ownership grant, and audit trail', { skip: !enabled }, async t => {
  const prisma = createClient()
  const suffix = `${Date.now()}-${process.pid}`
  let buyerId
  let uploaderId
  let trackId

  t.after(async () => {
    if (trackId) {
      await prisma.auditEvent.deleteMany({
        where: {
          entityType: 'Track',
          entityId: String(trackId)
        }
      })
    }

    await prisma.user.deleteMany({
      where: {
        id: {
          in: [buyerId, uploaderId].filter(Boolean)
        }
      }
    })

    await prisma.$disconnect()
  })

  const uploader = await prisma.user.create({
    data: {
      email: `integration-uploader-${suffix}@example.com`,
      name: 'Integration Uploader',
      role: 'UPLOADER',
      uploaderStatus: 'APPROVED'
    }
  })
  uploaderId = uploader.id

  const buyer = await prisma.user.create({
    data: {
      email: `integration-buyer-${suffix}@example.com`,
      name: 'Integration Buyer'
    }
  })
  buyerId = buyer.id

  const track = await prisma.track.create({
    data: {
      fileName: `integration/${suffix}.mp3`,
      title: 'Integration Test Track',
      composer: 'Synthetic Fixture',
      status: 'PUBLISHED',
      moderationStatus: 'APPROVED',
      processingStatus: 'READY',
      publishedAt: new Date('2026-06-25T12:00:00.000Z'),
      reviewedAt: new Date('2026-06-25T12:00:00.000Z'),
      uploadedBy: {
        connect: {
          id: uploader.id
        }
      },
      previewStart: 0,
      previewEnd: 10,
      durationSeconds: 120,
      sourceContentType: 'audio/mpeg',
      price: 2.99,
      pricePence: 299,
      currency: 'gbp',
      formattedPrice: 'GBP 2.99',
      downloadName: 'integration-test-track.mp3',
      downloadCount: 0,
      key: 'C major',
      instrumentation: 'Piano',
      additionalInfo: 'Integration fixture'
    }
  })
  trackId = track.id

  const checkoutSessionId = `cs_integration_${suffix}`
  const paymentIntentId = `pi_integration_${suffix}`
  const stripeEventId = `evt_integration_${suffix}`

  const order = await prisma.order.create({
    data: {
      userId: buyer.id,
      amountTotal: 299,
      currency: 'gbp',
      stripeCheckoutSession: checkoutSessionId,
      items: {
        create: [
          {
            trackId: track.id,
            title: track.title,
            composer: track.composer,
            unitAmount: 299,
            currency: 'gbp'
          }
        ]
      }
    },
    include: {
      items: true
    }
  })

  await prisma.$transaction(async tx => {
    await tx.order.update({
      where: {
        id: order.id
      },
      data: {
        status: 'PAID',
        stripePaymentIntent: paymentIntentId
      }
    })

    await tx.trackOwner.upsert({
      where: {
        trackId_userId: {
          trackId: track.id,
          userId: buyer.id
        }
      },
      update: {},
      create: {
        trackId: track.id,
        userId: buyer.id
      }
    })

    await tx.paymentEvent.create({
      data: {
        stripeEventId,
        type: 'checkout.session.completed',
        orderId: order.id,
        payload: JSON.stringify({
          id: stripeEventId,
          type: 'checkout.session.completed',
          data: {
            object: {
              id: checkoutSessionId,
              payment_intent: paymentIntentId,
              payment_status: 'paid'
            }
          }
        })
      }
    })

    await tx.auditEvent.create({
      data: {
        action: 'ownership.granted',
        actorId: buyer.id,
        entityType: 'Track',
        entityId: String(track.id),
        metadata: JSON.stringify({
          orderId: order.id,
          stripeCheckoutSession: checkoutSessionId,
          stripePaymentIntent: paymentIntentId
        })
      }
    })
  })

  const paidOrder = await prisma.order.findUniqueOrThrow({
    where: {
      id: order.id
    },
    include: {
      items: true,
      paymentEvents: true
    }
  })
  assert.equal(paidOrder.status, 'PAID')
  assert.equal(paidOrder.items.length, 1)
  assert.equal(paidOrder.paymentEvents.length, 1)

  const ownership = await prisma.trackOwner.findUnique({
    where: {
      trackId_userId: {
        trackId: track.id,
        userId: buyer.id
      }
    }
  })
  assert.equal(Boolean(ownership), true)

  const auditEvent = await prisma.auditEvent.findFirst({
    where: {
      action: 'ownership.granted',
      actorId: buyer.id,
      entityType: 'Track',
      entityId: String(track.id)
    }
  })
  assert.equal(Boolean(auditEvent), true)
})
