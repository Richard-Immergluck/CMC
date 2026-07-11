import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod,
  requireTrustedRouteOrigin
} from '../../../../lib/server/route-handlers'
import {
  createNotFoundError
} from '../../../../lib/server/api-core.mjs'
import { recordAuditEvent } from '../../../../lib/server/audit'
import { auditActions } from '../../../../lib/server/audit-core.mjs'
import { getAdminPricingReviews } from '../../../../lib/server/admin-pricing-reviews.mjs'
import { requireRouteCurrentUser, requireSensitiveRouteCurrentUser } from '../../../../lib/server/route-auth'
import { requireAdminPermission, requireSupportPermission } from '../../../../lib/server/permissions.mjs'
import prisma from '../../../../lib/server/prisma'
import { getWorksCollectionStatusAfterPricingDecision } from '../../../../lib/server/works-collections-core.mjs'
import { createRouteTelemetry } from '../../../../lib/server/route-telemetry'
import {
  adminPricingReviewBodySchema,
  validateInput
} from '../../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['GET', 'PATCH'])

const reviewStatusByDecision = {
  approve: 'APPROVED',
  reject: 'REJECTED'
}

export async function GET(request) {
  try {
    requireRouteMethod(request, ['GET'])

    const user = await requireRouteCurrentUser()
    requireSupportPermission(user)

    return jsonResponse(200, await getAdminPricingReviews())
  } catch (error) {
    return handleRouteError(error, request)
  }
}

export async function PATCH(request) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/admin/pricing-reviews',
    event: 'admin.pricing_review'
  })

  try {
    requireRouteMethod(request, ['PATCH'])
    requireTrustedRouteOrigin(request)

    const user = await requireSensitiveRouteCurrentUser({
      route: '/api/admin/pricing-reviews'
    })
    requireAdminPermission(user)

    const body = await parseRouteJson(request)
    const input = validateInput(
      adminPricingReviewBodySchema,
      body,
      'Invalid pricing review request'
    )
    const nextStatus = reviewStatusByDecision[input.decision]

    if (input.targetType === 'track') {
      const track = await prisma.track.findUnique({
        where: {
          id: input.targetId
        }
      })

      if (!track) {
        throw createNotFoundError('Track not found')
      }

      const updatedTrack = await prisma.track.update({
        where: {
          id: input.targetId
        },
        data: {
          pricingReviewStatus: nextStatus,
          moderationNotes: input.note || track.moderationNotes
        }
      })

      await recordAuditEvent({
        action: auditActions.trackPricingReviewed,
        actorId: user.id,
        entityType: 'Track',
        entityId: input.targetId,
        metadata: {
          before: track.pricingReviewStatus,
          after: updatedTrack.pricingReviewStatus,
          decision: input.decision,
          noteProvided: Boolean(input.note),
          pricePence: track.pricePence
        }
      })

      telemetry.complete({
        statusCode: 200,
        userId: user.id,
        targetId: input.targetId,
        targetType: input.targetType,
        decision: input.decision
      })

      return jsonResponse(200, {
        pricingReviewStatus: updatedTrack.pricingReviewStatus,
        targetId: updatedTrack.id,
        targetType: input.targetType
      })
    }

    if (input.targetType === 'release') {
      const release = await prisma.catalogueRelease.findUnique({
        where: {
          id: input.targetId
        }
      })

      if (!release) {
        throw createNotFoundError('Work or Collection not found')
      }

      const updatedRelease = await prisma.catalogueRelease.update({
        where: {
          id: input.targetId
        },
        data: {
          pricingReviewStatus: nextStatus,
          status: getWorksCollectionStatusAfterPricingDecision(input.decision)
        }
      })

      await recordAuditEvent({
        action: auditActions.worksCollectionPricingReviewed,
        actorId: user.id,
        entityType: 'CatalogueRelease',
        entityId: input.targetId,
        metadata: {
          before: release.pricingReviewStatus,
          after: updatedRelease.pricingReviewStatus,
          decision: input.decision,
          noteProvided: Boolean(input.note),
          pricePence: release.pricePence,
          statusAfter: updatedRelease.status,
          statusBefore: release.status
        }
      })

      telemetry.complete({
        statusCode: 200,
        userId: user.id,
        targetId: input.targetId,
        targetType: input.targetType,
        decision: input.decision
      })

      return jsonResponse(200, {
        pricingReviewStatus: updatedRelease.pricingReviewStatus,
        status: updatedRelease.status,
        targetId: updatedRelease.id,
        targetType: input.targetType
      })
    }

    const proposal = await prisma.requestPricingProposal.findUnique({
      where: {
        id: input.targetId
      }
    })

    if (!proposal) {
      throw createNotFoundError('Request pricing proposal not found')
    }

    const updatedProposal = await prisma.requestPricingProposal.update({
      where: {
        id: input.targetId
      },
      data: {
        reviewStatus: nextStatus
      }
    })

    await recordAuditEvent({
      action: auditActions.requestPricingReviewed,
      actorId: user.id,
      entityType: 'RequestPricingProposal',
      entityId: input.targetId,
      metadata: {
        before: proposal.reviewStatus,
        after: updatedProposal.reviewStatus,
        decision: input.decision,
        noteProvided: Boolean(input.note),
        pricePence: proposal.pricePence,
        requestId: proposal.requestId
      }
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      targetId: input.targetId,
      targetType: input.targetType,
      decision: input.decision
    })

    return jsonResponse(200, {
      reviewStatus: updatedProposal.reviewStatus,
      targetId: updatedProposal.id,
      targetType: input.targetType
    })
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
