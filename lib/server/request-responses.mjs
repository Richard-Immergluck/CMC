import {
  getPricingReviewStatus
} from '../pricing-policy.mjs'
import {
  auditActions,
  buildAuditEventData
} from './audit-core.mjs'
import {
  createForbiddenError,
  createNotFoundError,
  createValidationError
} from './api-core.mjs'
import { canUploadTracks } from './permissions.mjs'
import prisma from './prisma.js'

export const trackRequestActiveWindowMonths = 2

export const getTrackRequestExpiry = (createdAt, windowMonths = trackRequestActiveWindowMonths) => {
  const createdDate = createdAt instanceof Date ? createdAt : new Date(createdAt)
  const expiresAt = new Date(createdDate.getTime())

  expiresAt.setUTCMonth(expiresAt.getUTCMonth() + windowMonths)

  return expiresAt
}

export const isTrackRequestExpired = (request, now = new Date()) => {
  if (!request?.expiresAt) {
    return false
  }

  return new Date(request.expiresAt).getTime() < now.getTime()
}

const requireRequestResponsePermission = user => {
  if (!canUploadTracks(user)) {
    throw createForbiddenError('Approved uploader access required to respond to requests')
  }
}

export const upsertTrackRequestResponse = ({ input, requestId, user }) => {
  return prisma.$transaction(async tx => {
    requireRequestResponsePermission(user)

    const trackRequest = await tx.trackRequest.findUnique({
      where: {
        id: requestId
      },
      include: {
        responses: {
          where: {
            respondedById: user.id
          },
          take: 1
        },
        track: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    })

    if (!trackRequest || !trackRequest.track) {
      throw createNotFoundError('Track request not found')
    }

    if (isTrackRequestExpired(trackRequest)) {
      throw createValidationError('This request has expired')
    }

    const existingResponse = trackRequest.responses[0]

    if (existingResponse?.status === 'COMPLETED') {
      throw createValidationError('Completed request responses cannot be changed')
    }

    const nextStatus = input.status
    const accepting = nextStatus === 'ACCEPTED'
    const reviewStatus = accepting
      ? getPricingReviewStatus({
        catalogueType: input.catalogueType,
        pricePence: input.pricePence
      })
      : 'AUTO_APPROVED'

    const data = accepting
      ? {
          catalogueType: input.catalogueType,
          currency: input.currency || 'gbp',
          pricePence: input.pricePence,
          pricingJustification: input.pricingJustification || null,
          pricingReviewStatus: reviewStatus,
          rejectionNote: null,
          rejectionReason: null,
          responseNote: input.responseNote || null,
          saleFormat: input.saleFormat,
          status: nextStatus
        }
      : {
          catalogueType: input.catalogueType,
          currency: input.currency || 'gbp',
          pricePence: null,
          pricingJustification: null,
          pricingReviewStatus: 'AUTO_APPROVED',
          rejectionNote: input.rejectionNote || null,
          rejectionReason: input.rejectionReason || null,
          responseNote: input.responseNote || null,
          saleFormat: input.saleFormat,
          status: nextStatus
        }

    const response = await tx.trackRequestResponse.upsert({
      where: {
        requestId_respondedById: {
          requestId,
          respondedById: user.id
        }
      },
      update: data,
      create: {
        ...data,
        requestId,
        respondedById: user.id
      },
      include: {
        fulfilledByTrack: {
          select: {
            id: true,
            moderationStatus: true,
            processingStatus: true,
            status: true,
            title: true
          }
        },
        respondedBy: {
          select: {
            email: true,
            id: true,
            name: true
          }
        }
      }
    })

    await tx.auditEvent.create({
      data: buildAuditEventData({
        action: auditActions.requestResponseUpdated,
        actorId: user.id,
        entityType: 'TrackRequestResponse',
        entityId: response.id,
        metadata: {
          requestId,
          responseStatus: response.status,
          pricePence: response.pricePence,
          pricingReviewStatus: response.pricingReviewStatus,
          trackId: trackRequest.track.id
        }
      })
    })

    return response
  })
}

export const completeTrackRequestResponse = async ({
  fulfilledTrackId,
  requestId,
  tx,
  user
}) => {
  requireRequestResponsePermission(user)

  const trackRequest = await tx.trackRequest.findUnique({
    where: {
      id: requestId
    },
    include: {
      responses: {
        where: {
          respondedById: user.id
        },
        take: 1
      },
      track: {
        select: {
          id: true
        }
      }
    }
  })

  if (!trackRequest || !trackRequest.track) {
    throw createValidationError('Fulfilment request not found')
  }

  const response = trackRequest.responses[0]

  if (!response || response.status !== 'ACCEPTED') {
    throw createValidationError('Only accepted request responses can be completed by an upload')
  }

  if (response.pricingReviewStatus === 'NEEDS_REVIEW') {
    throw createValidationError('CMC must review this response price before fulfilment upload')
  }

  if (response.pricingReviewStatus === 'REJECTED') {
    throw createValidationError('Rejected response prices cannot be fulfilled')
  }

  const completedResponse = await tx.trackRequestResponse.update({
    where: {
      id: response.id
    },
    data: {
      completedAt: new Date(),
      fulfilledByTrackId: fulfilledTrackId,
      status: 'COMPLETED'
    }
  })

  await tx.trackRequest.update({
    where: {
      id: requestId
    },
    data: {
      fulfilledByTrackId: fulfilledTrackId,
      status: 'COMPLETED'
    }
  })

  await tx.auditEvent.create({
    data: buildAuditEventData({
      action: auditActions.requestResponseCompleted,
      actorId: user.id,
      entityType: 'TrackRequestResponse',
      entityId: completedResponse.id,
      metadata: {
        requestId,
        fulfilledTrackId,
        sourceTrackId: trackRequest.track.id
      }
    })
  })

  return completedResponse
}
