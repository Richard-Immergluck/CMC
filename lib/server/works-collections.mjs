import {
  formatPricePence,
  getPricingReviewStatus,
  pricingReviewStatuses,
  saleFormats
} from '../pricing-policy.mjs'
import {
  auditActions,
  buildAuditEventData,
  buildWorksCollectionCreatedMetadata,
  buildWorksCollectionDeletedMetadata,
  buildWorksCollectionUpdatedMetadata
} from './audit-core.mjs'
import {
  createForbiddenError,
  createNotFoundError,
  createValidationError
} from './api-core.mjs'
import prisma from './prisma.js'

const publicReadyTrackWhere = {
  moderationStatus: 'APPROVED',
  processingStatus: 'READY',
  status: 'PUBLISHED'
}

const worksCollectionInclude = {
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
    include: worksCollectionInclude,
    orderBy: {
      createdAt: 'desc'
    }
  })
}

const normalizeUniqueTrackIds = trackIdsInput => {
  const trackIds = [...new Set(trackIdsInput.map(Number))]

  if (trackIds.length !== trackIdsInput.length) {
    throw createValidationError('Each track can only be added once')
  }

  return trackIds
}

const getUserApprovedTracks = ({ tx, trackIds, userId }) => {
  return tx.track.findMany({
    where: {
      id: {
        in: trackIds
      },
      userId,
      ...publicReadyTrackWhere
    },
    select: {
      id: true,
      title: true
    }
  })
}

const requireAllTracksOwnedAndReady = async ({ tx, trackIds, user }) => {
  const tracks = await getUserApprovedTracks({
    tx,
    trackIds,
    userId: user.id
  })

  if (tracks.length !== trackIds.length) {
    throw createForbiddenError('Works & Collections can only use your own approved uploaded tracks')
  }

  return tracks
}

const buildCollectionData = ({ input, pricingReviewStatus }) => ({
  catalogueType: input.catalogueType,
  composer: input.composer || null,
  currency: input.currency || 'gbp',
  formattedPrice: formatPricePence(input.pricePence),
  pricePence: input.pricePence,
  pricingJustification: input.pricingJustification || null,
  pricingReviewStatus,
  saleFormat: input.saleFormat || saleFormats.both,
  title: input.title
})

export const createWorksCollection = ({ input, user }) => {
  const trackIds = [...new Set(input.trackIds.map(Number))]

  if (trackIds.length !== input.trackIds.length) {
    throw createValidationError('Each track can only be added once')
  }

  return prisma.$transaction(async tx => {
    const tracks = await requireAllTracksOwnedAndReady({
      tx,
      trackIds,
      user
    })

    const pricingReviewStatus = getPricingReviewStatus({
      catalogueType: input.catalogueType,
      pricePence: input.pricePence
    })

    const collection = await tx.catalogueRelease.create({
      data: {
        ...buildCollectionData({
          input,
          pricingReviewStatus
        }),
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
      include: worksCollectionInclude
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

export const updateWorksCollection = ({ collectionId, input, user }) => {
  const trackIds = normalizeUniqueTrackIds(input.trackIds)

  return prisma.$transaction(async tx => {
    const existingCollection = await tx.catalogueRelease.findUnique({
      where: {
        id: collectionId
      },
      include: worksCollectionInclude
    })

    if (!existingCollection) {
      throw createNotFoundError('Work or Collection not found')
    }

    if (existingCollection.userId !== user.id) {
      throw createForbiddenError('Only the uploader can manage this Work or Collection')
    }

    const tracks = await requireAllTracksOwnedAndReady({
      tx,
      trackIds,
      user
    })
    const pricingReviewStatus = getPricingReviewStatus({
      catalogueType: input.catalogueType,
      pricePence: input.pricePence
    })

    await tx.catalogueReleaseTrack.deleteMany({
      where: {
        releaseId: collectionId
      }
    })

    const collection = await tx.catalogueRelease.update({
      where: {
        id: collectionId
      },
      data: {
        ...buildCollectionData({
          input,
          pricingReviewStatus
        }),
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
      include: worksCollectionInclude
    })

    await tx.auditEvent.create({
      data: buildAuditEventData({
        action: auditActions.worksCollectionUpdated,
        actorId: user.id,
        entityType: 'CatalogueRelease',
        entityId: collection.id,
        metadata: buildWorksCollectionUpdatedMetadata({
          before: {
            catalogueType: existingCollection.catalogueType,
            pricePence: existingCollection.pricePence,
            saleFormat: existingCollection.saleFormat,
            title: existingCollection.title,
            trackCount: existingCollection.tracks.length
          },
          after: {
            catalogueType: collection.catalogueType,
            pricePence: collection.pricePence,
            saleFormat: collection.saleFormat,
            title: collection.title,
            trackCount: collection.tracks.length
          },
          trackIds
        })
      })
    })

    return collection
  })
}

export const deleteWorksCollection = ({ collectionId, user }) => {
  return prisma.$transaction(async tx => {
    const existingCollection = await tx.catalogueRelease.findUnique({
      where: {
        id: collectionId
      },
      include: {
        tracks: true
      }
    })

    if (!existingCollection) {
      throw createNotFoundError('Work or Collection not found')
    }

    if (existingCollection.userId !== user.id) {
      throw createForbiddenError('Only the uploader can manage this Work or Collection')
    }

    await tx.catalogueRelease.delete({
      where: {
        id: collectionId
      }
    })

    await tx.auditEvent.create({
      data: buildAuditEventData({
        action: auditActions.worksCollectionDeleted,
        actorId: user.id,
        entityType: 'CatalogueRelease',
        entityId: collectionId,
        metadata: buildWorksCollectionDeletedMetadata({
          catalogueType: existingCollection.catalogueType,
          title: existingCollection.title,
          trackCount: existingCollection.tracks.length
        })
      })
    })
  })
}

export { pricingReviewStatuses }
