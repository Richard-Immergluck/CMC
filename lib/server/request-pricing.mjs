import {
  getPricingReviewStatus,
  pricingReviewStatuses
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
import prisma from './prisma.js'

const manageableRequestStatuses = new Set(['OPEN', 'PENDING_DECISION', 'ACCEPTED'])

export const createRequestPricingProposal = ({ input, requestId, user }) => {
  return prisma.$transaction(async tx => {
    const trackRequest = await tx.trackRequest.findUnique({
      where: {
        id: requestId
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

    if (!trackRequest || !trackRequest.track) {
      throw createNotFoundError('Track request not found')
    }

    if (trackRequest.track.userId !== user.id) {
      throw createForbiddenError('Only the track uploader can propose request pricing')
    }

    if (!manageableRequestStatuses.has(trackRequest.status)) {
      throw createValidationError('Only open, pending, or accepted requests can receive a pricing proposal')
    }

    const reviewStatus = getPricingReviewStatus({
      catalogueType: input.catalogueType,
      pricePence: input.pricePence
    })

    await tx.requestPricingProposal.updateMany({
      where: {
        requestId,
        requesterDecision: 'PENDING'
      },
      data: {
        requesterDecision: 'SUPERSEDED'
      }
    })

    const proposal = await tx.requestPricingProposal.create({
      data: {
        requestId,
        proposedById: user.id,
        pricePence: input.pricePence,
        currency: input.currency || 'gbp',
        catalogueType: input.catalogueType,
        saleFormat: input.saleFormat,
        reviewStatus,
        justification: input.justification || null
      }
    })

    await tx.trackRequest.update({
      where: {
        id: requestId
      },
      data: {
        status: reviewStatus === pricingReviewStatuses.needsReview
          ? 'PENDING_DECISION'
          : trackRequest.status === 'OPEN'
            ? 'PENDING_DECISION'
            : trackRequest.status
      }
    })

    await tx.auditEvent.create({
      data: buildAuditEventData({
        action: auditActions.requestPricingProposed,
        actorId: user.id,
        entityType: 'TrackRequest',
        entityId: requestId,
        metadata: {
          catalogueType: proposal.catalogueType,
          pricePence: proposal.pricePence,
          proposalId: proposal.id,
          requesterDecision: proposal.requesterDecision,
          reviewStatus: proposal.reviewStatus,
          saleFormat: proposal.saleFormat,
          trackId: trackRequest.track.id
        }
      })
    })

    return proposal
  })
}

export const decideRequestPricingProposal = ({ input, proposalId, requestId, user }) => {
  return prisma.$transaction(async tx => {
    const proposal = await tx.requestPricingProposal.findFirst({
      where: {
        id: proposalId,
        requestId
      },
      include: {
        request: {
          include: {
            track: {
              select: {
                id: true,
                userId: true
              }
            }
          }
        }
      }
    })

    if (!proposal || !proposal.request) {
      throw createNotFoundError('Request pricing proposal not found')
    }

    if (proposal.request.userId !== user.id) {
      throw createForbiddenError('Only the requester can respond to proposed pricing')
    }

    if (proposal.requesterDecision !== 'PENDING') {
      throw createValidationError('Only pending pricing proposals can be accepted or declined')
    }

    if (input.decision === 'ACCEPTED' && proposal.reviewStatus === pricingReviewStatuses.rejected) {
      throw createValidationError('Rejected pricing proposals cannot be accepted')
    }

    if (input.decision === 'ACCEPTED' && proposal.reviewStatus === pricingReviewStatuses.needsReview) {
      throw createValidationError('Pricing proposals needing admin review cannot be accepted yet')
    }

    const updatedProposal = await tx.requestPricingProposal.update({
      where: {
        id: proposalId
      },
      data: {
        requesterDecision: input.decision,
        requesterNote: input.requesterNote || null,
        requesterRespondedAt: new Date()
      }
    })

    await tx.trackRequest.update({
      where: {
        id: requestId
      },
      data: {
        status: input.decision === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING_DECISION'
      }
    })

    await tx.auditEvent.create({
      data: buildAuditEventData({
        action: auditActions.requestPricingDecided,
        actorId: user.id,
        entityType: 'RequestPricingProposal',
        entityId: proposalId,
        metadata: {
          decision: input.decision,
          hasRequesterNote: Boolean(input.requesterNote),
          pricePence: proposal.pricePence,
          requestId,
          reviewStatus: proposal.reviewStatus,
          trackId: proposal.request.track?.id || null,
          trackOwnerId: proposal.request.track?.userId || null
        }
      })
    })

    return updatedProposal
  })
}
