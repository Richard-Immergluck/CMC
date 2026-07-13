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

const dayMs = 24 * 60 * 60 * 1000

const addDays = (date, days) => new Date(date.getTime() + days * dayMs)

const generatedTrackTitlePrefixes = [
  'E2E Browser Upload ',
  'E2E Checkout Study ',
  'E2E Pending Review ',
  'E2E Catalogue ',
  'E2E Peer Catalogue '
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

const generatedReleaseTitlePrefixes = [
  'E2E Checkout Collection ',
  'E2E Collection ',
  'E2E Archived Collection ',
  'E2E Grouped Work ',
  'E2E Learning Pack '
]

const generatedUploadBatchLabels = [
  'E2E Batch Import',
  'E2E Submitted Batch',
  'E2E Completed Batch'
]

const requestTitlePrefixFilters = generatedRequestTitlePrefixes.map(prefix => ({
  title: {
    startsWith: prefix
  }
}))

const releaseTitlePrefixFilters = generatedReleaseTitlePrefixes.map(prefix => ({
  title: {
    startsWith: prefix
  }
}))

const uploadBatchLabelFilters = generatedUploadBatchLabels.map(label => ({
  label: {
    startsWith: label
  }
}))

const richardUploadEmails = [
  'rimmergluck@googlemail.com',
  'richard@immergluck.co.uk'
]

const cleanGeneratedE2EData = async () => {
  await prisma.catalogueRelease.deleteMany({
    where: {
      OR: releaseTitlePrefixFilters
    }
  })

  await prisma.uploadBatch.deleteMany({
    where: {
      OR: uploadBatchLabelFilters
    }
  })

  const generatedTracks = await prisma.track.findMany({
    where: {
      OR: titlePrefixFilters
    },
    select: {
      id: true
    }
  })
  const generatedTrackIds = generatedTracks.map(track => track.id)

  const generatedRequests = await prisma.trackRequest.findMany({
    where: {
      OR: requestTitlePrefixFilters
    },
    select: {
      id: true
    }
  })
  const generatedRequestIds = generatedRequests.map(request => request.id)

  if (generatedTrackIds.length === 0) {
    await prisma.$transaction([
      prisma.trackRequestResponse.deleteMany({
        where: {
          requestId: {
            in: generatedRequestIds
          }
        }
      }),
      prisma.trackRequest.deleteMany({
        where: {
          id: {
            in: generatedRequestIds
          }
        }
      })
    ])
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
    prisma.trackRequestResponse.deleteMany({
      where: {
        requestId: {
          in: generatedRequestIds
        }
      }
    }),
    prisma.trackRequest.deleteMany({
      where: {
        id: {
          in: generatedRequestIds
        }
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

  const peerUploader = await prisma.user.upsert({
    where: {
      email: 'e2e-peer-uploader@example.com'
    },
    update: {
      name: 'E2E Peer Uploader',
      role: 'UPLOADER',
      uploaderStatus: 'APPROVED',
      accountStatus: 'ACTIVE'
    },
    create: {
      email: 'e2e-peer-uploader@example.com',
      name: 'E2E Peer Uploader',
      role: 'UPLOADER',
      uploaderStatus: 'APPROVED',
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

  const draftBatch = await prisma.uploadBatch.create({
    data: {
      label: 'E2E Batch Import - Draft Song Cycle',
      defaultComposer: 'Synthetic Test Fixture',
      defaultInstrumentation: 'Voice and piano rehearsal',
      defaultPricePence: 499,
      status: 'DRAFT',
      createdAt: new Date('2026-07-01T09:00:00.000Z'),
      updatedAt: new Date('2026-07-01T09:00:00.000Z'),
      uploadedBy: {
        connect: {
          id: uploader.id
        }
      }
    }
  })
  const submittedBatch = await prisma.uploadBatch.create({
    data: {
      label: 'E2E Submitted Batch - Opera Scenes',
      defaultComposer: 'Synthetic Test Fixture',
      defaultInstrumentation: 'Practice orchestra',
      defaultPricePence: 699,
      status: 'SUBMITTED',
      createdAt: new Date('2026-07-02T09:00:00.000Z'),
      updatedAt: new Date('2026-07-02T10:00:00.000Z'),
      submittedAt: new Date('2026-07-02T10:00:00.000Z'),
      uploadedBy: {
        connect: {
          id: uploader.id
        }
      }
    }
  })
  const completedBatch = await prisma.uploadBatch.create({
    data: {
      label: 'E2E Completed Batch - Teaching Collection',
      defaultComposer: 'Synthetic Test Fixture',
      defaultInstrumentation: 'Piano guide tone',
      defaultPricePence: 299,
      status: 'COMPLETED',
      createdAt: new Date('2026-07-03T09:00:00.000Z'),
      updatedAt: new Date('2026-07-03T12:00:00.000Z'),
      submittedAt: new Date('2026-07-03T10:00:00.000Z'),
      completedAt: new Date('2026-07-03T12:00:00.000Z'),
      uploadedBy: {
        connect: {
          id: uploader.id
        }
      }
    }
  })

  const trackData = {
    fileName: 'e2e-fixtures/catalogue-navigation.wav',
    previewFileName: 'e2e-fixtures/catalogue-navigation.wav',
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
    additionalInfo: 'Synthetic database-only fixture for browser smoke tests.',
    uploadBatch: {
      connect: {
        id: completedBatch.id
      }
    }
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
  const savedExtraCatalogueTracks = []
  const extraCatalogueTracks = demoCatalogueTracks.slice(1).map((demoTrack, index) => ({
    fileName: `demo-fixtures/${demoTrack.slug}.wav`,
    previewFileName: `demo-fixtures/${demoTrack.slug}.wav`,
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
    additionalInfo: demoTrack.additionalInfo,
    uploadBatch: index < 8
      ? {
          connect: {
            id: completedBatch.id
          }
        }
      : index < 16
        ? {
            connect: {
              id: submittedBatch.id
            }
          }
        : undefined
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

    savedExtraCatalogueTracks.push(savedTrack)

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

  const uploadStateTracks = [
    {
      fileName: 'demo-fixtures/bach-warmup-study-op-12.wav',
      previewFileName: 'demo-fixtures/bach-warmup-study-op-12.wav',
      title: 'E2E Pending Review Upload - Schubert Lieder Cue',
      composer: 'Schubert Style Synthetic Fixture',
      status: 'DRAFT',
      moderationStatus: 'PENDING',
      processingStatus: 'READY',
      uploadBatchId: submittedBatch.id
    },
    {
      fileName: 'demo-fixtures/mozart-phrase-study-op-13.wav',
      previewFileName: 'demo-fixtures/mozart-phrase-study-op-13.wav',
      title: 'E2E Browser Upload Processing Fixture',
      composer: 'Mozart Style Synthetic Fixture',
      status: 'PROCESSING',
      moderationStatus: 'PENDING',
      processingStatus: 'PROCESSING',
      uploadBatchId: draftBatch.id
    }
  ]

  for (const [index, uploadStateTrack] of uploadStateTracks.entries()) {
    const existingUploadStateTrack = await prisma.track.findFirst({
      where: {
        title: uploadStateTrack.title,
        composer: uploadStateTrack.composer,
        userId: uploader.id
      }
    })
    const uploadStateTrackData = {
      ...uploadStateTrack,
      uploadedBy: {
        connect: {
          id: uploader.id
        }
      },
      previewStart: 0,
      previewEnd: 10,
      durationSeconds: 120 + index * 30,
      sourceContentType: 'audio/wav',
      price: 4.99,
      pricePence: 499,
      currency: 'gbp',
      formattedPrice: 'GBP 4.99',
      downloadName: `e2e-upload-state-${index + 1}.wav`,
      downloadCount: 0,
      key: index === 0 ? 'G minor' : 'F major',
      instrumentation: index === 0 ? 'Voice and piano rehearsal' : 'Practice orchestra',
      additionalInfo: 'Synthetic upload-state fixture for management and moderation views.',
      uploadBatch: {
        connect: {
          id: uploadStateTrack.uploadBatchId
        }
      },
      uploadBatchId: undefined
    }

    if (existingUploadStateTrack) {
      await prisma.track.update({
        where: {
          id: existingUploadStateTrack.id
        },
        data: uploadStateTrackData
      })
    } else {
      await prisma.track.create({
        data: uploadStateTrackData
      })
    }
  }

  const uploaderPurchasedTracks = []
  const peerCatalogueTracks = demoCatalogueTracks.slice(8, 13).map((demoTrack, index) => ({
    fileName: `demo-fixtures/${demoTrack.slug}.wav`,
    previewFileName: `demo-fixtures/${demoTrack.slug}.wav`,
    title: `E2E Peer Catalogue ${demoTrack.title}`,
    composer: demoTrack.composer,
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    processingStatus: 'READY',
    publishedAt: new Date(`2026-05-${String(10 + index).padStart(2, '0')}T12:00:00.000Z`),
    reviewedAt: new Date(`2026-05-${String(10 + index).padStart(2, '0')}T12:00:00.000Z`),
    uploadedBy: {
      connect: {
        id: peerUploader.id
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
    additionalInfo: `${demoTrack.additionalInfo} Seeded as a peer-uploader purchase fixture.`
  }))

  for (const [index, peerTrack] of peerCatalogueTracks.entries()) {
    const existingPeerTrack = await prisma.track.findFirst({
      where: {
        title: peerTrack.title,
        composer: peerTrack.composer,
        userId: peerUploader.id
      }
    })

    const savedPeerTrack = existingPeerTrack
      ? await prisma.track.update({
        where: {
          id: existingPeerTrack.id
        },
        data: peerTrack
      })
      : await prisma.track.create({
        data: peerTrack
      })

    if (index < 4) {
      uploaderPurchasedTracks.push(savedPeerTrack)
      await prisma.trackOwner.upsert({
        where: {
          trackId_userId: {
            trackId: savedPeerTrack.id,
            userId: uploader.id
          }
        },
        update: {
          purchasedAt: new Date(`2026-07-${String(index + 6).padStart(2, '0')}T11:00:00.000Z`)
        },
        create: {
          trackId: savedPeerTrack.id,
          userId: uploader.id,
          purchasedAt: new Date(`2026-07-${String(index + 6).padStart(2, '0')}T11:00:00.000Z`)
        }
      })
    }
  }

  const collectionTracks = savedExtraCatalogueTracks.slice(0, 4)
  const learningPackTracks = savedExtraCatalogueTracks.slice(4, 9)
  const archivedCollectionTracks = savedExtraCatalogueTracks.slice(9, 12)
  let publishedCollection = null
  let reviewCollection = null
  let archivedCollection = null

  if (collectionTracks.length >= 2) {
    publishedCollection = await prisma.catalogueRelease.create({
      data: {
        title: 'E2E Collection Bach Warmup Pack',
        composer: 'Bach Style Synthetic Fixture',
        catalogueType: 'COLLECTION',
        saleFormat: 'BOTH',
        pricePence: 999,
        currency: 'gbp',
        formattedPrice: 'GBP 9.99',
        pricingReviewStatus: 'AUTO_APPROVED',
        pricingJustification: 'Standard grouped fixture for collection browsing and checkout.',
        status: 'PUBLISHED',
        createdAt: new Date('2026-07-04T09:00:00.000Z'),
        uploadedBy: {
          connect: {
            id: uploader.id
          }
        },
        tracks: {
          create: collectionTracks.map((collectionTrack, index) => ({
            movementNo: `No. ${index + 1}`,
            position: index + 1,
            titleInWork: collectionTrack.title.replace(/^E2E Catalogue /, ''),
            track: {
              connect: {
                id: collectionTrack.id
              }
            }
          }))
        }
      }
    })
  }

  if (learningPackTracks.length >= 2) {
    reviewCollection = await prisma.catalogueRelease.create({
      data: {
        title: 'E2E Learning Pack Opera Scenes',
        composer: 'Mixed synthetic composers',
        catalogueType: 'LEARNING_PACK',
        saleFormat: 'BUNDLE',
        pricePence: 2999,
        currency: 'gbp',
        formattedPrice: 'GBP 29.99',
        pricingReviewStatus: 'NEEDS_REVIEW',
        pricingJustification: 'Large multi-track teaching pack intentionally priced for admin review coverage.',
        status: 'PUBLISHED',
        createdAt: new Date('2026-07-05T09:00:00.000Z'),
        uploadedBy: {
          connect: {
            id: uploader.id
          }
        },
        tracks: {
          create: learningPackTracks.map((collectionTrack, index) => ({
            movementNo: `Scene ${index + 1}`,
            position: index + 1,
            titleInWork: collectionTrack.title.replace(/^E2E Catalogue /, ''),
            track: {
              connect: {
                id: collectionTrack.id
              }
            }
          }))
        }
      }
    })
  }

  if (archivedCollectionTracks.length >= 2) {
    archivedCollection = await prisma.catalogueRelease.create({
      data: {
        title: 'E2E Archived Collection Purchased Fixture',
        composer: 'Archive Synthetic Fixture',
        catalogueType: 'COLLECTION',
        saleFormat: 'BOTH',
        pricePence: 1499,
        currency: 'gbp',
        formattedPrice: 'GBP 14.99',
        pricingReviewStatus: 'APPROVED',
        pricingJustification: 'Archived after purchase to test release lifecycle handling.',
        status: 'ARCHIVED',
        createdAt: new Date('2026-07-06T09:00:00.000Z'),
        uploadedBy: {
          connect: {
            id: uploader.id
          }
        },
        tracks: {
          create: archivedCollectionTracks.map((collectionTrack, index) => ({
            movementNo: `Archive ${index + 1}`,
            position: index + 1,
            titleInWork: collectionTrack.title.replace(/^E2E Catalogue /, ''),
            track: {
              connect: {
                id: collectionTrack.id
              }
            }
          }))
        }
      }
    })

    const archivedOrder = await prisma.order.create({
      data: {
        userId: customer.id,
        status: 'PAID',
        amountTotal: archivedCollection.pricePence,
        currency: 'gbp',
        stripeCheckoutSession: `cs_e2e_archived_collection_${archivedCollection.id}`,
        stripePaymentIntent: `pi_e2e_archived_collection_${archivedCollection.id}`,
        createdAt: new Date('2026-07-06T10:00:00.000Z'),
        items: {
          create: archivedCollectionTracks.map((collectionTrack, index) => {
            const baseAmount = Math.floor(archivedCollection.pricePence / archivedCollectionTracks.length)
            const remainder = archivedCollection.pricePence % archivedCollectionTracks.length

            return {
              trackId: collectionTrack.id,
              sourceReleaseId: archivedCollection.id,
              sourceReleaseTitle: archivedCollection.title,
              title: collectionTrack.title.replace(/^E2E Catalogue /, ''),
              composer: collectionTrack.composer,
              unitAmount: baseAmount + (index < remainder ? 1 : 0),
              currency: 'gbp'
            }
          })
        }
      }
    })

    await prisma.paymentEvent.create({
      data: {
        stripeEventId: `evt_e2e_archived_collection_${archivedCollection.id}`,
        type: 'checkout.session.completed',
        orderId: archivedOrder.id,
        payload: JSON.stringify({
          id: `evt_e2e_archived_collection_${archivedCollection.id}`,
          type: 'checkout.session.completed',
          fixture: true
        })
      }
    })

    for (const collectionTrack of archivedCollectionTracks) {
      await prisma.trackOwner.upsert({
        where: {
          trackId_userId: {
            trackId: collectionTrack.id,
            userId: customer.id
          }
        },
        update: {
          sourceReleaseId: archivedCollection.id,
          sourceReleaseTitle: archivedCollection.title
        },
        create: {
          trackId: collectionTrack.id,
          userId: customer.id,
          sourceReleaseId: archivedCollection.id,
          sourceReleaseTitle: archivedCollection.title,
          purchasedAt: new Date('2026-07-06T10:05:00.000Z')
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

  const uploaderOwnerComments = [
    'Uploader note: this guide track is intentionally steady for first-pass rehearsal.',
    'Uploader note: phrasing cues are slightly forward in the mix for entry practice.'
  ]

  for (const [index, ownerComment] of uploaderOwnerComments.entries()) {
    const ownerCommentTrack = purchasedTracks[index] || purchasedTracks[0]

    await prisma.comment.create({
      data: {
        content: ownerComment,
        postedBy: {
          connect: {
            id: uploader.id
          }
        },
        track: {
          connect: {
            id: ownerCommentTrack.id
          }
        },
        createdAt: new Date(`2026-07-${String(index + 7).padStart(2, '0')}T15:15:00.000Z`)
      }
    })
  }

  const bachWarmupTrack = savedExtraCatalogueTracks.find(savedTrack => (
    savedTrack.title === 'E2E Catalogue Bach Warmup Study Op. 92'
  ))
  const bachWarmupRequests = [
    {
      title: 'E2E Request Bach Warmup Slower Tempo',
      composer: 'Bach Style Synthetic Fixture',
      instrumentation: 'Piano guide tone',
      notes: 'Please add a slower preview-friendly version for early warmup work.',
      status: 'OPEN',
      userId: customer.id,
      createdAt: new Date('2026-07-10T13:15:00.000Z')
    },
    {
      title: 'E2E Request Bach Warmup Violin Cue',
      composer: 'Bach Style Synthetic Fixture',
      instrumentation: 'Violin and piano',
      notes: 'A version with a light violin entry cue would make this easier to use in lessons.',
      status: 'OPEN',
      responses: [
        {
          catalogueType: 'MOVEMENT',
          currency: 'gbp',
          pricePence: 999,
          pricingReviewStatus: 'AUTO_APPROVED',
          pricingJustification: 'Seeded uploader response for requester visibility testing.',
          responseNote: 'I can prepare this as a movement-length violin cue.',
          saleFormat: 'INDIVIDUAL',
          status: 'ACCEPTED',
          respondedById: uploader.id
        }
      ],
      userId: support.id,
      createdAt: new Date('2026-07-10T13:45:00.000Z')
    },
    {
      title: 'E2E Request Bach Warmup Accepted Cut',
      composer: 'Bach Style Synthetic Fixture',
      instrumentation: 'Piano guide tone',
      notes: 'Accepted request fixture for testing upload fulfilment from the details page.',
      status: 'OPEN',
      responses: [
        {
          catalogueType: 'SINGLE_TRACK',
          currency: 'gbp',
          pricePence: 499,
          pricingReviewStatus: 'AUTO_APPROVED',
          pricingJustification: 'Seeded accepted response for fulfilment testing.',
          responseNote: 'Accepted and ready for preparation.',
          saleFormat: 'INDIVIDUAL',
          status: 'ACCEPTED',
          respondedById: uploader.id
        }
      ],
      userId: customer.id,
      createdAt: new Date('2026-07-10T13:55:00.000Z')
    },
    {
      title: 'E2E Request Bach Warmup Clarinet Version',
      composer: 'Bach Style Synthetic Fixture',
      instrumentation: 'Clarinet and piano',
      notes: 'A declined fixture so the rejected state can be reviewed by requesters and uploaders.',
      status: 'OPEN',
      responses: [
        {
          rejectionNote: 'Clarinet cue versions are not part of this uploader’s current catalogue plan.',
          rejectionReason: 'outside_catalogue_plans',
          responseNote: 'Another uploader may still respond during the request window.',
          status: 'DECLINED',
          respondedById: uploader.id
        }
      ],
      userId: support.id,
      createdAt: new Date('2026-07-10T14:00:00.000Z')
    },
    {
      title: 'E2E Request Bach Warmup Short Cut',
      composer: 'Bach Style Synthetic Fixture',
      instrumentation: 'Piano guide tone',
      notes: 'Could this be available as a short 45-second rehearsal cut?',
      status: 'COMPLETED',
      fulfilledByTrackId: savedExtraCatalogueTracks[12]?.id,
      responses: [
        {
          catalogueType: 'SINGLE_TRACK',
          completedAt: new Date('2026-07-10T15:10:00.000Z'),
          currency: 'gbp',
          fulfilledByTrackId: savedExtraCatalogueTracks[12]?.id,
          pricePence: 499,
          pricingReviewStatus: 'AUTO_APPROVED',
          pricingJustification: 'Seeded completed response for fulfilment display testing.',
          responseNote: 'Prepared as a short rehearsal cut.',
          saleFormat: 'INDIVIDUAL',
          status: 'COMPLETED',
          respondedById: uploader.id
        }
      ],
      userId: customer.id,
      createdAt: new Date('2026-07-10T14:10:00.000Z')
    }
  ]

  if (bachWarmupTrack) {
    const bachWarmupComments = [
      {
        content: 'The pulse is very steady here; useful for first-play warmups before moving to faster excerpts.',
        createdAt: new Date('2026-07-10T10:20:00.000Z'),
        userId: customer.id
      },
      {
        content: 'Uploader note: this was designed as a clean harmonic guide rather than a performance-style accompaniment.',
        createdAt: new Date('2026-07-10T11:05:00.000Z'),
        userId: uploader.id
      },
      {
        content: 'Could work well for sectional practice. The lower line is clear enough to tune against.',
        createdAt: new Date('2026-07-10T12:40:00.000Z'),
        userId: support.id
      }
    ]

    for (const commentFixture of bachWarmupComments) {
      await prisma.comment.create({
        data: {
          content: commentFixture.content,
          createdAt: commentFixture.createdAt,
          postedBy: {
            connect: {
              id: commentFixture.userId
            }
          },
          track: {
            connect: {
              id: bachWarmupTrack.id
            }
          }
        }
      })
    }
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
      status: 'OPEN',
      responses: [
        {
          catalogueType: 'SINGLE_TRACK',
          currency: 'gbp',
          pricePence: 499,
          pricingReviewStatus: 'AUTO_APPROVED',
          pricingJustification: 'Standard single-track response for the requested cut.',
          responseNote: 'Accepted for preparation during the request window.',
          saleFormat: 'INDIVIDUAL',
          status: 'ACCEPTED',
          respondedById: uploader.id
        }
      ]
    },
    {
      title: 'E2E Request Mozart Clarinet Concerto Adagio',
      composer: 'W. A. Mozart',
      instrumentation: 'Clarinet and orchestra reduction',
      notes: 'Request fulfilled by an existing catalogue upload for smoke coverage.',
      status: 'COMPLETED',
      fulfilledByTrackId: purchasedTracks[2]?.id,
      responses: [
        {
          catalogueType: 'SINGLE_TRACK',
          completedAt: new Date('2026-07-06T12:00:00.000Z'),
          currency: 'gbp',
          fulfilledByTrackId: purchasedTracks[2]?.id,
          pricePence: 499,
          pricingReviewStatus: 'AUTO_APPROVED',
          pricingJustification: 'Fulfilled by an existing catalogue upload.',
          responseNote: 'Uploaded and available as a normal paid catalogue track.',
          saleFormat: 'INDIVIDUAL',
          status: 'COMPLETED',
          respondedById: uploader.id
        }
      ]
    }
  ]

  await prisma.trackRequest.deleteMany({
    where: {
      userId: {
        in: [customer.id, uploader.id, support.id]
      },
      OR: requestTitlePrefixFilters
    }
  })

  if (bachWarmupTrack) {
    for (const requestFixture of bachWarmupRequests) {
      const expiresAt = addDays(requestFixture.createdAt, 60)

      await prisma.trackRequest.create({
        data: {
          composer: requestFixture.composer,
          expiresAt,
          instrumentation: requestFixture.instrumentation,
          notes: requestFixture.notes,
          status: requestFixture.status,
          title: requestFixture.title,
          createdAt: requestFixture.createdAt,
          requestedBy: {
            connect: {
              id: requestFixture.userId
            }
          },
          track: {
            connect: {
              id: bachWarmupTrack.id
            }
          },
          fulfilledByTrack: requestFixture.fulfilledByTrackId
            ? {
                connect: {
                  id: requestFixture.fulfilledByTrackId
                }
              }
            : undefined,
          responses: requestFixture.responses?.length
            ? {
                create: requestFixture.responses.map(response => response)
              }
            : undefined
        }
      })
    }
  }

  for (const [index, requestFixture] of requestFixtures.entries()) {
    const { fulfilledByTrackId, responses, ...requestData } = requestFixture
    const requestTrack = purchasedTracks[index] || purchasedTracks[0]
    const createdAt = new Date(`2026-07-${String(index + 3).padStart(2, '0')}T09:15:00.000Z`)

    await prisma.trackRequest.create({
      data: {
        ...requestData,
        expiresAt: addDays(createdAt, 60),
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
        fulfilledByTrack: fulfilledByTrackId
          ? {
              connect: {
                id: fulfilledByTrackId
              }
            }
          : undefined,
        responses: responses?.length
          ? {
              create: responses.map(response => response)
            }
          : undefined,
        createdAt
      }
    })
  }

  const uploaderRequestFixtures = [
    {
      title: 'E2E Request Uploader Schumann Lieder Cycle',
      composer: 'Robert Schumann',
      instrumentation: 'Voice and piano',
      notes: 'Uploader testing request state visibility for a purchased peer track.',
      status: 'OPEN'
    },
    {
      title: 'E2E Request Uploader Debussy Syrinx Guide',
      composer: 'Claude Debussy',
      instrumentation: 'Flute practice guide',
      notes: 'Uploader has asked for an alternate guide tempo on a track they own.',
      status: 'OPEN',
      responses: [
        {
          catalogueType: 'SINGLE_TRACK',
          currency: 'gbp',
          pricePence: 399,
          pricingReviewStatus: 'AUTO_APPROVED',
          pricingJustification: 'Accepted by a peer uploader for standard guide-track pricing.',
          responseNote: 'Accepted and preparing a shorter guide cut.',
          saleFormat: 'INDIVIDUAL',
          status: 'ACCEPTED',
          respondedById: customer.id
        }
      ]
    },
    {
      title: 'E2E Request Uploader Faure Elegie Reduction',
      composer: 'Gabriel Faure',
      instrumentation: 'Cello and piano',
      notes: 'Uploader request fixture marked fulfilled for profile and detail review.',
      status: 'COMPLETED',
      fulfilledByTrackId: uploaderPurchasedTracks[2]?.id,
      responses: [
        {
          catalogueType: 'SINGLE_TRACK',
          completedAt: new Date('2026-07-12T11:45:00.000Z'),
          currency: 'gbp',
          fulfilledByTrackId: uploaderPurchasedTracks[2]?.id,
          pricePence: 499,
          pricingReviewStatus: 'AUTO_APPROVED',
          pricingJustification: 'Fulfilled from a peer catalogue upload.',
          responseNote: 'Completed and available in the catalogue.',
          saleFormat: 'INDIVIDUAL',
          status: 'COMPLETED',
          respondedById: customer.id
        }
      ]
    }
  ]

  for (const [index, requestFixture] of uploaderRequestFixtures.entries()) {
    const { fulfilledByTrackId, responses, ...requestData } = requestFixture
    const requestTrack = uploaderPurchasedTracks[index] || uploaderPurchasedTracks[0]
    const createdAt = new Date(`2026-07-${String(index + 8).padStart(2, '0')}T09:45:00.000Z`)

    if (!requestTrack) {
      continue
    }

    await prisma.trackRequest.create({
      data: {
        ...requestData,
        expiresAt: addDays(createdAt, 60),
        track: {
          connect: {
            id: requestTrack.id
          }
        },
        requestedBy: {
          connect: {
            id: uploader.id
          }
        },
        fulfilledByTrack: fulfilledByTrackId
          ? {
              connect: {
                id: fulfilledByTrackId
              }
            }
          : undefined,
        responses: responses?.length
          ? {
              create: responses.map(response => response)
            }
          : undefined,
        createdAt
      }
    })
  }

  console.log(`Seeded ${extraCatalogueTracks.length + 1} E2E catalogue tracks for ${uploader.email}`)
  console.log(`Seeded ${peerCatalogueTracks.length} E2E peer catalogue tracks for ${peerUploader.email}`)
  console.log(`Seeded ${purchasedTracks.length} E2E customer purchases for ${customer.email}`)
  console.log(`Seeded ${uploaderPurchasedTracks.length} E2E uploader purchases for ${uploader.email}`)
  console.log(`Seeded ${customerComments.length} E2E customer comments for ${customer.email}`)
  console.log(`Seeded ${uploaderOwnerComments.length} E2E uploader owner comments for ${uploader.email}`)
  console.log(`Seeded Bach Warmup detail fixtures for ${bachWarmupTrack?.title || 'missing target track'}`)
  console.log(`Seeded ${requestFixtures.length} E2E customer requests for ${customer.email}`)
  console.log(`Seeded ${uploaderRequestFixtures.length} E2E uploader requests for ${uploader.email}`)
  console.log(`Seeded 3 E2E upload batches for ${uploader.email}`)
  console.log(`Seeded ${[
    publishedCollection,
    reviewCollection,
    archivedCollection
  ].filter(Boolean).length} E2E Works & Collections fixtures`)

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
