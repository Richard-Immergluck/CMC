import prisma from './prisma.js'
import {
  createForbiddenError,
  createValidationError
} from './api-core.mjs'
import {
  auditActions,
  buildAuditEventData,
  buildTrackSubmittedMetadata
} from './audit-core.mjs'
import { toTrackCreateData } from './tracks-core.mjs'
import { roles, uploaderStatuses } from '../access-control.mjs'

export { createDownloadName, normalizeTrackPrice, toTrackCreateData } from './tracks-core.mjs'

export const createUploadedTrack = ({ input, user }) => {
  return prisma.$transaction(async tx => {
    let fulfilledRequest = null

    if (input.uploadBatchId) {
      const uploadBatch = await tx.uploadBatch.findFirst({
        where: {
          id: input.uploadBatchId,
          userId: user.id
        },
        select: {
          id: true
        }
      })

      if (!uploadBatch) {
        throw createForbiddenError('Upload batch access denied')
      }
    }

    if (input.fulfilledRequestId) {
      fulfilledRequest = await tx.trackRequest.findUnique({
        where: {
          id: input.fulfilledRequestId
        },
        include: {
          track: {
            select: {
              id: true,
              userId: true
            }
          }
        }
      })

      if (!fulfilledRequest || !fulfilledRequest.track) {
        throw createValidationError('Fulfilment request not found')
      }

      if (fulfilledRequest.track.userId !== user.id) {
        throw createForbiddenError('Only the track uploader can fulfil this request')
      }

      if (fulfilledRequest.status !== 'ACCEPTED') {
        throw createValidationError('Only accepted requests can be completed by an upload')
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

    if (fulfilledRequest) {
      await tx.trackRequest.update({
        where: {
          id: fulfilledRequest.id
        },
        data: {
          fulfilledByTrackId: track.id,
          status: 'COMPLETED'
        }
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
