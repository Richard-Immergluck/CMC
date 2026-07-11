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
