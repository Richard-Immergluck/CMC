import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { demoCatalogueTracks } from '../lib/demo/catalogue-fixtures.mjs'

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
  'E2E Pending Review ',
  'E2E Catalogue '
]

const titlePrefixFilters = generatedTrackTitlePrefixes.map(prefix => ({
  title: {
    startsWith: prefix
  }
}))

const generatedRequestTitlePrefixes = [
  'E2E Request ',
  'E2E Smoke Request '
]

const requestTitlePrefixFilters = generatedRequestTitlePrefixes.map(prefix => ({
  title: {
    startsWith: prefix
  }
}))

const richardUploadEmails = [
  'rimmergluck@googlemail.com',
  'richard@immergluck.co.uk'
]

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
    prisma.trackRequest.deleteMany({
      where: {
        OR: requestTitlePrefixFilters
      }
    }),
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

  const support = await prisma.user.upsert({
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

  await prisma.auditEvent.deleteMany({
    where: {
      action: 'auth.sign_in_denied',
      entityType: 'User',
      entityId: support.id
    }
  })
  await prisma.auditEvent.create({
    data: {
      action: 'auth.sign_in_denied',
      actorId: support.id,
      entityType: 'User',
      entityId: support.id,
      metadata: JSON.stringify({
        accountStatus: 'SUSPENDED',
        provider: 'e2e',
        reason: 'inactive_account'
      }),
      createdAt: new Date('2026-06-25T12:05:00.000Z')
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

  const purchasedTracks = [track]
  const extraCatalogueTracks = demoCatalogueTracks.slice(1).map((demoTrack, index) => ({
    fileName: `demo-fixtures/${demoTrack.slug}.wav`,
    title: `E2E Catalogue ${demoTrack.title}`,
    composer: demoTrack.composer,
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    processingStatus: 'READY',
    publishedAt: new Date(`2026-06-${String(1 + (index % 25)).padStart(2, '0')}T12:00:00.000Z`),
    reviewedAt: new Date(`2026-06-${String(1 + (index % 25)).padStart(2, '0')}T12:00:00.000Z`),
    uploadedBy: {
      connect: {
        id: uploader.id
      }
    },
    previewStart: 0,
    previewEnd: Math.min(10, demoTrack.seconds),
    durationSeconds: demoTrack.durationSeconds,
    sourceContentType: 'audio/wav',
    price: demoTrack.pricePence / 100,
    pricePence: demoTrack.pricePence,
    currency: 'gbp',
    formattedPrice: demoTrack.formattedPrice,
    downloadName: `${demoTrack.slug}.wav`,
    downloadCount: 0,
    key: demoTrack.key,
    instrumentation: demoTrack.instrumentation,
    additionalInfo: demoTrack.additionalInfo
  }))

  for (const [index, extraTrack] of extraCatalogueTracks.entries()) {
    const existingExtraTrack = await prisma.track.findFirst({
      where: {
        title: extraTrack.title,
        composer: extraTrack.composer,
        userId: uploader.id
      }
    })

    const savedTrack = existingExtraTrack
      ? await prisma.track.update({
        where: {
          id: existingExtraTrack.id
        },
        data: extraTrack
      })
      : await prisma.track.create({
        data: extraTrack
      })

    if (index < 5) {
      purchasedTracks.push(savedTrack)
      await prisma.trackOwner.upsert({
        where: {
          trackId_userId: {
            trackId: savedTrack.id,
            userId: customer.id
          }
        },
        update: {
          purchasedAt: new Date(`2026-07-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`)
        },
        create: {
          trackId: savedTrack.id,
          userId: customer.id,
          purchasedAt: new Date(`2026-07-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`)
        }
      })
    }
  }

  const customerComments = [
    'Useful balance for slow practice; the piano guide sits clearly in the texture.',
    'This one is especially helpful for checking entries after the development section.',
    'Good rehearsal tempo, and the harmonic cues are easy to follow.',
    'I would like a slightly longer preview window on this style of track.',
    'The accompaniment feels natural enough for daily practice.'
  ]

  for (const [index, purchasedTrack] of purchasedTracks.slice(0, 5).entries()) {
    await prisma.comment.create({
      data: {
        content: customerComments[index],
        postedBy: {
          connect: {
            id: customer.id
          }
        },
        track: {
          connect: {
            id: purchasedTrack.id
          }
        },
        createdAt: new Date(`2026-07-${String(index + 2).padStart(2, '0')}T14:30:00.000Z`)
      }
    })
  }

  const requestFixtures = [
    {
      title: 'E2E Request Poulenc Oboe Sonata',
      composer: 'Francis Poulenc',
      instrumentation: 'Oboe and piano',
      notes: 'Looking for a steady rehearsal track with clear piano cues.',
      status: 'OPEN'
    },
    {
      title: 'E2E Request Saint-Saens Allegro appassionato',
      composer: 'Camille Saint-Saens',
      instrumentation: 'Cello and piano',
      notes: 'Useful if the accompaniment has a flexible but stable tempo.',
      status: 'IN_PROGRESS'
    },
    {
      title: 'E2E Request Mozart Clarinet Concerto Adagio',
      composer: 'W. A. Mozart',
      instrumentation: 'Clarinet and orchestra reduction',
      notes: 'Request fulfilled by an existing catalogue upload for smoke coverage.',
      status: 'FULFILLED'
    }
  ]

  await prisma.trackRequest.deleteMany({
    where: {
      userId: customer.id,
      OR: requestTitlePrefixFilters
    }
  })

  for (const [index, requestFixture] of requestFixtures.entries()) {
    const requestTrack = purchasedTracks[index] || purchasedTracks[0]

    await prisma.trackRequest.create({
      data: {
        ...requestFixture,
        track: {
          connect: {
            id: requestTrack.id
          }
        },
        requestedBy: {
          connect: {
            id: customer.id
          }
        },
        createdAt: new Date(`2026-07-${String(index + 3).padStart(2, '0')}T09:15:00.000Z`)
      }
    })
  }

  console.log(`Seeded ${extraCatalogueTracks.length + 1} E2E catalogue tracks for ${uploader.email}`)
  console.log(`Seeded ${purchasedTracks.length} E2E customer purchases for ${customer.email}`)
  console.log(`Seeded ${customerComments.length} E2E customer comments for ${customer.email}`)
  console.log(`Seeded ${requestFixtures.length} E2E customer requests for ${customer.email}`)

  const richardPlaybackTrack = await prisma.track.findFirst({
    where: {
      status: 'PUBLISHED',
      moderationStatus: 'APPROVED',
      processingStatus: 'READY',
      uploadedBy: {
        email: {
          in: richardUploadEmails
        }
      }
    },
    orderBy: {
      uploadedAt: 'desc'
    }
  })

  if (richardPlaybackTrack) {
    await prisma.trackOwner.upsert({
      where: {
        trackId_userId: {
          trackId: richardPlaybackTrack.id,
          userId: customer.id
        }
      },
      update: {},
      create: {
        trackId: richardPlaybackTrack.id,
        userId: customer.id
      }
    })

    console.log(`Linked ${customer.email} to Richard playback track ${richardPlaybackTrack.id}`)
  } else {
    console.log('Skipped Richard playback track ownership: no eligible published upload found')
  }
}

try {
  await seed()
} finally {
  await prisma.$disconnect()
}
