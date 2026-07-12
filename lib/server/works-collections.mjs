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
} from './api-core.mjs'
import prisma from './prisma.js'
import {
  canEditWorksCollection,
  catalogueReleaseStatuses,
  getWorksCollectionPriceContext,
  getInitialWorksCollectionStatus,
  getWorksCollectionDeleteResolution,
  isPublicWorksCollectionStatus,
  normalizeTrackItems
} from './works-collections-core.mjs'

const publicReadyTrackWhere = {
  moderationStatus: 'APPROVED',
  processingStatus: 'READY',
  status: 'PUBLISHED'
}

const publicWorksCollectionWhere = {
  pricingReviewStatus: {
    in: [
      pricingReviewStatuses.autoApproved,
      pricingReviewStatuses.approved
    ]
  },
  status: {
    in: [catalogueReleaseStatuses.published].filter(isPublicWorksCollectionStatus)
  },
  tracks: {
    every: {
      track: {
        is: publicReadyTrackWhere
      }
    },
    some: {
      track: {
        is: publicReadyTrackWhere
      }
    }
  }
}

const worksCollectionInclude = {
  tracks: {
    include: {
      track: {
        select: {
          id: true,
          title: true,
          composer: true,
          formattedPrice: true,
          moderationStatus: true,
          pricePence: true,
          processingStatus: true,
          status: true
        }
      }
    },
    orderBy: {
      position: 'asc'
    }
  }
}

const publicWorksCollectionInclude = {
  tracks: {
    include: {
      track: {
        select: {
          id: true,
          title: true,
          composer: true,
          key: true,
          instrumentation: true,
          durationSeconds: true,
          pricePence: true,
          formattedPrice: true
        }
      }
    },
    orderBy: {
      position: 'asc'
    }
  },
  uploadedBy: {
    select: {
      id: true,
      name: true
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
  ...getWorksCollectionPriceContext(collection),
  pricePence: collection.pricePence,
  pricingReviewStatus: collection.pricingReviewStatus,
  saleFormat: collection.saleFormat,
  status: collection.status,
  title: collection.title,
  tracks: (collection.tracks || []).map(item => ({
    id: item.track.id,
    composer: item.track.composer,
    formattedPrice: item.track.formattedPrice || formatPricePence(item.track.pricePence || 0),
    movementNo: item.movementNo,
    moderationStatus: item.track.moderationStatus,
    position: item.position,
    pricePence: item.track.pricePence,
    processingStatus: item.track.processingStatus,
    status: item.track.status,
    title: item.titleInWork || item.track.title,
    titleInWork: item.titleInWork,
    trackId: item.track.id
  }))
})

export const serializePublicWorksCollection = collection => ({
  ...serializeWorksCollection(collection),
  trackCount: collection.tracks?.length || 0,
  uploaderName: collection.uploadedBy?.name || 'Unknown uploader',
  tracks: (collection.tracks || []).map(item => ({
    id: item.track.id,
    composer: item.track.composer,
    durationSeconds: item.track.durationSeconds,
    formattedPrice: item.track.formattedPrice || formatPricePence(item.track.pricePence || 0),
    instrumentation: item.track.instrumentation,
    key: item.track.key,
    movementNo: item.movementNo,
    position: item.position,
    pricePence: item.track.pricePence,
    title: item.titleInWork || item.track.title,
    titleInWork: item.titleInWork,
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

export const getUserWorksCollection = ({ collectionId, userId }) => {
  return prisma.catalogueRelease.findFirst({
    where: {
      id: collectionId,
      userId
    },
    include: worksCollectionInclude
  })
}

export const listPublicWorksCollections = ({ take = 50 } = {}) => {
  return prisma.catalogueRelease.findMany({
    where: publicWorksCollectionWhere,
    include: publicWorksCollectionInclude,
    orderBy: [
      {
        createdAt: 'desc'
      },
      {
        title: 'asc'
      }
    ],
    take
  })
}

export const getPublicWorksCollection = ({ collectionId }) => {
  return prisma.catalogueRelease.findFirst({
    where: {
      id: collectionId,
      ...publicWorksCollectionWhere
    },
    include: publicWorksCollectionInclude
  })
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
  status: getInitialWorksCollectionStatus({
    pricingReviewStatus
  }),
  title: input.title
})

export const createWorksCollection = ({ input, user }) => {
  const trackItems = normalizeTrackItems(input)
  const trackIds = trackItems.map(item => item.trackId)

  return prisma.$transaction(async tx => {
    const tracks = await requireAllTracksOwnedAndReady({
      tx,
      trackIds,
      user
    })
    const tracksById = new Map(tracks.map(track => [track.id, track]))

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
          create: trackItems.map(item => ({
            movementNo: item.movementNo,
            position: item.position,
            titleInWork: item.titleInWork || tracksById.get(item.trackId)?.title,
            track: {
              connect: {
                id: item.trackId
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
  const trackItems = normalizeTrackItems(input)
  const trackIds = trackItems.map(item => item.trackId)

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

    if (!canEditWorksCollection(existingCollection)) {
      throw createForbiddenError('This Work or Collection cannot be edited in its current lifecycle state')
    }

    const tracks = await requireAllTracksOwnedAndReady({
      tx,
      trackIds,
      user
    })
    const tracksById = new Map(tracks.map(track => [track.id, track]))
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
          create: trackItems.map(item => ({
            movementNo: item.movementNo,
            position: item.position,
            titleInWork: item.titleInWork || tracksById.get(item.trackId)?.title,
            track: {
              connect: {
                id: item.trackId
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
        _count: {
          select: {
            orderItems: true,
            trackOwners: true
          }
        },
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

    if (!existingCollection) {
      throw createNotFoundError('Work or Collection not found')
    }

    if (existingCollection.userId !== user.id) {
      throw createForbiddenError('Only the uploader can manage this Work or Collection')
    }

    const deleteResolution = getWorksCollectionDeleteResolution(existingCollection)

    if (deleteResolution.action === 'archive') {
      await tx.catalogueRelease.update({
        where: {
          id: collectionId
        },
        data: {
          status: catalogueReleaseStatuses.archived
        }
      })
    } else {
      await tx.catalogueRelease.delete({
        where: {
          id: collectionId
        }
      })
    }

    await tx.auditEvent.create({
      data: buildAuditEventData({
        action: deleteResolution.action === 'archive'
          ? auditActions.worksCollectionArchived
          : auditActions.worksCollectionDeleted,
        actorId: user.id,
        entityType: 'CatalogueRelease',
        entityId: collectionId,
        metadata: buildWorksCollectionDeletedMetadata({
          catalogueType: existingCollection.catalogueType,
          orderItemCount: deleteResolution.orderItemCount,
          status: deleteResolution.action === 'archive' ? catalogueReleaseStatuses.archived : 'DELETED',
          title: existingCollection.title,
          trackCount: existingCollection.tracks.length,
          trackOwnerCount: deleteResolution.trackOwnerCount
        })
      })
    })

    return {
      action: deleteResolution.action,
      collection: deleteResolution.action === 'archive'
        ? {
            ...existingCollection,
            status: catalogueReleaseStatuses.archived
          }
        : null
    }
  })
}

export { catalogueReleaseStatuses, pricingReviewStatuses }
