import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod,
  requireTrustedRouteOrigin
} from '../../../../../lib/server/route-handlers'
import {
  createNotFoundError
} from '../../../../../lib/server/api-core.mjs'
import { requireSensitiveRouteCurrentUser } from '../../../../../lib/server/route-auth'
import {
  buildTrackModerationChangeMetadata,
  toTrackReviewItem,
  trackReviewInclude
} from '../../../../../lib/server/admin-core.mjs'
import { auditActions, buildAuditEventData } from '../../../../../lib/server/audit-core.mjs'
import { requireSupportPermission } from '../../../../../lib/server/permissions.mjs'
import prisma from '../../../../../lib/server/prisma'
import { createRouteTelemetry } from '../../../../../lib/server/route-telemetry'
import { applyReleaseDependencyModerationUpdates } from '../../../../../lib/server/release-dependency-moderation.mjs'
import {
  adminTrackModerationBodySchema,
  trackIdParamSchema,
  validateInput
} from '../../../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['PATCH'])

const decisionData = {
  approve: {
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    processingStatus: 'READY'
  },
  reject: {
    status: 'REJECTED',
    moderationStatus: 'REJECTED'
  },
  archive: {
    status: 'ARCHIVED'
  }
}

export async function PATCH(request, { params }) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/admin/tracks/[trackId]',
    event: 'admin.track_moderation'
  })

  try {
    requireRouteMethod(request, ['PATCH'])
    requireTrustedRouteOrigin(request)

    const user = await requireSensitiveRouteCurrentUser({
      route: '/api/admin/tracks/[trackId]'
    })
    requireSupportPermission(user)

    const routeParams = await params
    const { trackId } = validateInput(trackIdParamSchema, routeParams, 'Invalid track id')
    const body = await parseRouteJson(request)
    const input = validateInput(
      adminTrackModerationBodySchema,
      body,
      'Invalid track moderation request'
    )

    const after = await prisma.$transaction(async tx => {
      const before = await tx.track.findUnique({
        where: {
          id: trackId
        },
        include: trackReviewInclude
      })

      if (!before) {
        throw createNotFoundError('Track not found')
      }

      const reviewedAt = new Date()
      const updatedTrack = await tx.track.update({
        where: {
          id: trackId
        },
        data: {
          ...decisionData[input.decision],
          moderationNotes: input.moderationNotes,
          reviewedAt,
          publishedAt: input.decision === 'approve' ? reviewedAt : before.publishedAt
        },
        include: trackReviewInclude
      })

      await tx.auditEvent.create({
        data: buildAuditEventData({
          action: auditActions.trackModerationUpdated,
          actorId: user.id,
          entityType: 'Track',
          entityId: trackId,
          metadata: {
            decision: input.decision,
            notesProvided: Boolean(input.moderationNotes),
            ...buildTrackModerationChangeMetadata({
              before,
              after: updatedTrack
            })
          }
        })
      })

      await applyReleaseDependencyModerationUpdates({
        actorId: user.id,
        decision: input.decision,
        releaseItems: before.releaseItems,
        route: '/api/admin/tracks/[trackId]',
        trackId,
        tx
      })

      return tx.track.findUnique({
        where: {
          id: trackId
        },
        include: trackReviewInclude
      })
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      trackId,
      decision: input.decision
    })

    return jsonResponse(200, {
      track: toTrackReviewItem(after)
    })
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as GET,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
