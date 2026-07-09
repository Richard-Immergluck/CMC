import {
  formatPricePence,
  getPricingReviewStatus,
  pricingReviewStatuses,
  saleFormats
} from '../pricing-policy.mjs'
import {
  auditActions,
  buildAuditEventData,
  buildWorksCollectionCreatedMetadata
} from './audit-core.mjs'
import {
  createForbiddenError,
  createValidationError
} from './api-core.mjs'
import prisma from './prisma.js'

const publicReadyTrackWhere = {
  moderationStatus: 'APPROVED',
  processingStatus: 'READY',
  status: 'PUBLISHED'
}

export const serializeWorksCollection = collection => ({
  id: collection.id,
  catalogueType: collection.catalogueType,
  composer: collection.composer,
  createdAt: collection.createdAt,
  currency: collection.currency,
  formattedPrice: collection.formattedPrice || formatPricePence(collection.pricePence || 0),
  pricePence: collection.pricePence,
  pricingReviewStatus: collection.pricingReviewStatus,
  saleFormat: collection.saleFormat,
  title: collection.title,
  tracks: (collection.tracks || []).map(item => ({
    id: item.track.id,
    composer: item.track.composer,
    position: item.position,
    title: item.titleInWork || item.track.title,
    trackId: item.track.id
  }))
})

export const listUserWorksCollections = ({ userId }) => {
  return prisma.catalogueRelease.findMany({
    where: {
      userId
    },
    include: {
      tracks: {
        include: {
          track: {
            select: {
              id: true,
              title: true,
              composer: true
            }
          }
        },
        orderBy: {
          position: 'asc'
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export const createWorksCollection = ({ input, user }) => {
  const trackIds = [...new Set(input.trackIds.map(Number))]

  if (trackIds.length !== input.trackIds.length) {
    throw createValidationError('Each track can only be added once')
  }

  return prisma.$transaction(async tx => {
    const tracks = await tx.track.findMany({
      where: {
        id: {
          in: trackIds
        },
        userId: user.id,
        ...publicReadyTrackWhere
      },
      select: {
        id: true,
        title: true
      }
    })

    if (tracks.length !== trackIds.length) {
      throw createForbiddenError('Works & Collections can only use your own approved uploaded tracks')
    }

    const pricingReviewStatus = getPricingReviewStatus({
      catalogueType: input.catalogueType,
      pricePence: input.pricePence
    })

    const collection = await tx.catalogueRelease.create({
      data: {
        catalogueType: input.catalogueType,
        composer: input.composer || null,
        currency: input.currency || 'gbp',
        formattedPrice: formatPricePence(input.pricePence),
        pricePence: input.pricePence,
        pricingJustification: input.pricingJustification || null,
        pricingReviewStatus,
        saleFormat: input.saleFormat || saleFormats.both,
        title: input.title,
        uploadedBy: {
          connect: {
            id: user.id
          }
        },
        tracks: {
          create: trackIds.map((trackId, index) => ({
            position: index + 1,
            titleInWork: tracks.find(track => track.id === trackId)?.title,
            track: {
              connect: {
                id: trackId
              }
            }
          }))
        }
      },
      include: {
        tracks: {
          include: {
            track: {
              select: {
                id: true,
                title: true,
                composer: true
              }
            }
          },
          orderBy: {
            position: 'asc'
          }
        }
      }
    })

    await tx.auditEvent.create({
      data: buildAuditEventData({
        action: auditActions.worksCollectionCreated,
        actorId: user.id,
        entityType: 'CatalogueRelease',
        entityId: collection.id,
        metadata: buildWorksCollectionCreatedMetadata({
          catalogueType: collection.catalogueType,
          pricePence: collection.pricePence,
          saleFormat: collection.saleFormat,
          trackCount: trackIds.length,
          trackIds
        })
      })
    })

    return collection
  })
}

export { pricingReviewStatuses }
