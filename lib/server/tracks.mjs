import prisma from './prisma.js'
import {
  createForbiddenError,
  createNotFoundError,
  createValidationError
} from './api-core.mjs'
import {
  auditActions,
  buildAuditEventData,
  buildTrackMetadataUpdatedMetadata,
  buildTrackSubmittedMetadata
} from './audit-core.mjs'
import {
  getChangedTrackMetadataFields,
  toTrackCreateData,
  toTrackMetadataUpdateData
} from './tracks-core.mjs'
import {
  canAddTrackToUploadBatch,
  uploadBatchLimitMessage
} from './upload-batches-core.mjs'
import { completeTrackRequestResponse } from './request-responses.mjs'
import { roles, uploaderStatuses } from '../access-control.mjs'

export { createDownloadName, normalizeTrackPrice, toTrackCreateData } from './tracks-core.mjs'

export const createUploadedTrack = ({ input, user }) => {
  return prisma.$transaction(async tx => {
    const fulfilledRequestId = input.fulfilledRequestId || null

    if (input.uploadBatchId) {
      const uploadBatch = await tx.uploadBatch.findFirst({
        where: {
          id: input.uploadBatchId,
          userId: user.id
        },
        select: {
          id: true,
          status: true,
          _count: {
            select: {
              tracks: true
            }
          }
        }
      })

      if (!uploadBatch) {
        throw createForbiddenError('Upload batch access denied')
      }

      if (!canAddTrackToUploadBatch(uploadBatch)) {
        throw createValidationError(uploadBatchLimitMessage)
      }
    }

    const track = await tx.track.create({
      data: toTrackCreateData({ input, user })
    })

    if (user.role === roles.customer) {
      await tx.user.update({
        where: {
          id: user.id
        },
        data: {
          role: roles.uploader,
          uploaderStatus: uploaderStatuses.approved
        }
      })
    }

    if (fulfilledRequestId) {
      await completeTrackRequestResponse({
        fulfilledTrackId: track.id,
        requestId: fulfilledRequestId,
        tx,
        user
      })
    }

    await tx.auditEvent.create({
      data: buildAuditEventData({
        action: auditActions.trackSubmitted,
        actorId: user.id,
        entityType: 'Track',
        entityId: track.id,
        metadata: buildTrackSubmittedMetadata({
          currency: track.currency,
          hasAdditionalInfo: track.additionalInfo,
          catalogueType: track.catalogueType,
          pricePence: track.pricePence,
          pricingReviewStatus: track.pricingReviewStatus,
          saleFormat: track.saleFormat,
          processingStatus: track.processingStatus,
          sourceContentType: track.sourceContentType,
          status: track.status,
          moderationStatus: track.moderationStatus
        })
      })
    })

    return track
  })
}

export const updateUploadedTrackMetadata = ({ input, trackId, user }) => {
  return prisma.$transaction(async tx => {
    const existingTrack = await tx.track.findUnique({
      where: {
        id: trackId
      },
      select: {
        additionalInfo: true,
        composer: true,
        downloadName: true,
        id: true,
        instrumentation: true,
        key: true,
        status: true,
        title: true,
        userId: true
      }
    })

    if (!existingTrack) {
      throw createNotFoundError('Track not found')
    }

    if (existingTrack.userId !== user.id) {
      throw createForbiddenError('Only the track uploader can edit this track')
    }

    if (existingTrack.status === 'ARCHIVED') {
      throw createValidationError('Archived tracks cannot be edited')
    }

    const data = toTrackMetadataUpdateData(input)
    const changedFields = getChangedTrackMetadataFields({
      after: data,
      before: existingTrack
    })

    if (changedFields.length === 0) {
      return existingTrack
    }

    const updatedTrack = await tx.track.update({
      where: {
        id: trackId
      },
      data
    })

    await tx.auditEvent.create({
      data: buildAuditEventData({
        action: auditActions.trackMetadataUpdated,
        actorId: user.id,
        entityType: 'Track',
        entityId: trackId,
        metadata: buildTrackMetadataUpdatedMetadata({
          changedFields,
          route: '/api/tracks/[trackId]'
        })
      })
    })

    return updatedTrack
  })
}

export const bulkUpdateUploadedTrackMetadata = ({ input, user }) => {
  return prisma.$transaction(async tx => {
    const trackIds = input.trackIds
    const existingTracks = await tx.track.findMany({
      where: {
        id: {
          in: trackIds
        }
      },
      select: {
        additionalInfo: true,
        composer: true,
        downloadName: true,
        id: true,
        instrumentation: true,
        key: true,
        status: true,
        title: true,
        userId: true
      }
    })

    if (existingTracks.length !== trackIds.length) {
      throw createNotFoundError('One or more tracks were not found')
    }

    const inaccessibleTrack = existingTracks.find(track => track.userId !== user.id)

    if (inaccessibleTrack) {
      throw createForbiddenError('Only the track uploader can edit selected tracks')
    }

    const archivedTrack = existingTracks.find(track => track.status === 'ARCHIVED')

    if (archivedTrack) {
      throw createValidationError('Archived tracks cannot be edited')
    }

    const data = toTrackMetadataUpdateData(input.metadata)
    const tracksById = new Map(existingTracks.map(track => [track.id, track]))
    const tracks = []
    let updatedCount = 0

    for (const trackId of trackIds) {
      const existingTrack = tracksById.get(trackId)
      const changedFields = getChangedTrackMetadataFields({
        after: data,
        before: existingTrack
      })

      if (changedFields.length === 0) {
        tracks.push(existingTrack)
        continue
      }

      const updatedTrack = await tx.track.update({
        where: {
          id: trackId
        },
        data
      })

      await tx.auditEvent.create({
        data: buildAuditEventData({
          action: auditActions.trackMetadataUpdated,
          actorId: user.id,
          entityType: 'Track',
          entityId: trackId,
          metadata: buildTrackMetadataUpdatedMetadata({
            changedFields,
            route: '/api/tracks/bulk-metadata'
          })
        })
      })

      updatedCount += 1
      tracks.push(updatedTrack)
    }

    return {
      tracks,
      unchangedCount: tracks.length - updatedCount,
      updatedCount
    }
  })
}
