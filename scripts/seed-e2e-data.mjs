import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to seed E2E data')
}

if (process.env.VERCEL_ENV === 'production' && process.env.CMC_ALLOW_E2E_SEED !== 'true') {
  throw new Error('Refusing to seed E2E data in production without CMC_ALLOW_E2E_SEED=true')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL
  })
})

const generatedTrackTitlePrefixes = [
  'E2E Browser Upload ',
  'E2E Checkout Study ',
  'E2E Pending Review '
]

const titlePrefixFilters = generatedTrackTitlePrefixes.map(prefix => ({
  title: {
    startsWith: prefix
  }
}))

const cleanGeneratedE2EData = async () => {
  const generatedTracks = await prisma.track.findMany({
    where: {
      OR: titlePrefixFilters
    },
    select: {
      id: true
    }
  })
  const generatedTrackIds = generatedTracks.map(track => track.id)

  if (generatedTrackIds.length === 0) {
    return
  }

  const generatedOrderItems = await prisma.orderItem.findMany({
    where: {
      trackId: {
        in: generatedTrackIds
      }
    },
    select: {
      orderId: true
    }
  })
  const generatedOrderIds = [...new Set(generatedOrderItems.map(item => item.orderId))]
  const generatedTrackEntityIds = generatedTrackIds.map(id => `${id}`)
  const generatedOrderEntityIds = generatedOrderIds.map(id => `${id}`)

  await prisma.$transaction([
    prisma.paymentEvent.deleteMany({
      where: {
        orderId: {
          in: generatedOrderIds
        }
      }
    }),
    prisma.auditEvent.deleteMany({
      where: {
        OR: [
          {
            entityType: 'Track',
            entityId: {
              in: generatedTrackEntityIds
            }
          },
          {
            entityType: 'Order',
            entityId: {
              in: generatedOrderEntityIds
            }
          }
        ]
      }
    }),
    prisma.orderItem.deleteMany({
      where: {
        orderId: {
          in: generatedOrderIds
        }
      }
    }),
    prisma.order.deleteMany({
      where: {
        id: {
          in: generatedOrderIds
        }
      }
    }),
    prisma.comment.deleteMany({
      where: {
        trackId: {
          in: generatedTrackIds
        }
      }
    }),
    prisma.trackOwner.deleteMany({
      where: {
        trackId: {
          in: generatedTrackIds
        }
      }
    }),
    prisma.track.deleteMany({
      where: {
        id: {
          in: generatedTrackIds
        }
      }
    })
  ])
}

const seed = async () => {
  await cleanGeneratedE2EData()

  const uploader = await prisma.user.upsert({
    where: {
      email: 'e2e-uploader@example.com'
    },
    update: {
      name: 'E2E Uploader',
      role: 'UPLOADER',
      uploaderStatus: 'APPROVED',
      accountStatus: 'ACTIVE'
    },
    create: {
      email: 'e2e-uploader@example.com',
      name: 'E2E Uploader',
      role: 'UPLOADER',
      uploaderStatus: 'APPROVED',
      accountStatus: 'ACTIVE'
    }
  })

  const customer = await prisma.user.upsert({
    where: {
      email: 'e2e-customer@example.com'
    },
    update: {
      name: 'E2E Customer',
      role: 'CUSTOMER',
      uploaderStatus: 'NOT_REQUESTED',
      accountStatus: 'ACTIVE'
    },
    create: {
      email: 'e2e-customer@example.com',
      name: 'E2E Customer',
      role: 'CUSTOMER',
      uploaderStatus: 'NOT_REQUESTED',
      accountStatus: 'ACTIVE'
    }
  })

  await prisma.user.upsert({
    where: {
      email: 'e2e-admin@example.com'
    },
    update: {
      name: 'E2E Admin',
      role: 'ADMIN',
      uploaderStatus: 'APPROVED',
      accountStatus: 'ACTIVE'
    },
    create: {
      email: 'e2e-admin@example.com',
      name: 'E2E Admin',
      role: 'ADMIN',
      uploaderStatus: 'APPROVED',
      accountStatus: 'ACTIVE'
    }
  })

  await prisma.user.upsert({
    where: {
      email: 'e2e-support@example.com'
    },
    update: {
      name: 'E2E Support',
      role: 'SUPPORT',
      uploaderStatus: 'NOT_REQUESTED',
      accountStatus: 'ACTIVE'
    },
    create: {
      email: 'e2e-support@example.com',
      name: 'E2E Support',
      role: 'SUPPORT',
      uploaderStatus: 'NOT_REQUESTED',
      accountStatus: 'ACTIVE'
    }
  })

  const trackData = {
    fileName: 'e2e-fixtures/catalogue-navigation.wav',
    title: 'E2E Catalogue Navigation Study',
    composer: 'Synthetic Test Fixture',
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
    durationSeconds: 12,
    sourceContentType: 'audio/wav',
    price: 2.99,
    pricePence: 299,
    currency: 'gbp',
    formattedPrice: 'GBP 2.99',
    downloadName: 'catalogue-navigation.wav',
    downloadCount: 0,
    key: 'C major',
    instrumentation: 'Piano guide tone',
    additionalInfo: 'Synthetic database-only fixture for browser smoke tests.'
  }

  const existingTrack = await prisma.track.findFirst({
    where: {
      title: trackData.title,
      composer: trackData.composer,
      userId: uploader.id
    }
  })

  const track = existingTrack
    ? await prisma.track.update({
      where: {
        id: existingTrack.id
      },
      data: trackData
    })
    : await prisma.track.create({
      data: trackData
    })

  await prisma.trackOwner.upsert({
    where: {
      trackId_userId: {
        trackId: track.id,
        userId: customer.id
      }
    },
    update: {},
    create: {
      trackId: track.id,
      userId: customer.id
    }
  })

  console.log(`Seeded E2E catalogue track for ${uploader.email}`)
  console.log(`Seeded E2E customer ownership for ${customer.email}`)
}

try {
  await seed()
} finally {
  await prisma.$disconnect()
}
