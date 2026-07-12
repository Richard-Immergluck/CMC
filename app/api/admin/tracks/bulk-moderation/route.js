import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod,
  requireTrustedRouteOrigin
} from '../../../../../lib/server/route-handlers'
import {
  buildTrackModerationChangeMetadata,
  toTrackReviewItem,
  trackReviewInclude
} from '../../../../../lib/server/admin-core.mjs'
import { createValidationError } from '../../../../../lib/server/api-core.mjs'
import { requireSensitiveRouteCurrentUser } from '../../../../../lib/server/route-auth'
import { auditActions, buildAuditEventData } from '../../../../../lib/server/audit-core.mjs'
import { requireSupportPermission } from '../../../../../lib/server/permissions.mjs'
import prisma from '../../../../../lib/server/prisma'
import { createRouteTelemetry } from '../../../../../lib/server/route-telemetry'
import { getUploadBatchStatusAfterModeration } from '../../../../../lib/server/upload-batches-core.mjs'
import { applyReleaseDependencyModerationUpdates } from '../../../../../lib/server/release-dependency-moderation.mjs'
import {
  adminBulkTrackModerationBodySchema,
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
  }
}

export async function PATCH(request) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/admin/tracks/bulk-moderation',
    event: 'admin.track_bulk_moderation'
  })

  try {
    requireRouteMethod(request, ['PATCH'])
    requireTrustedRouteOrigin(request)

    const user = await requireSensitiveRouteCurrentUser({
      route: '/api/admin/tracks/bulk-moderation'
    })
    requireSupportPermission(user)

    const body = await parseRouteJson(request)
    const input = validateInput(
      adminBulkTrackModerationBodySchema,
      body,
      'Invalid bulk track moderation request'
    )

    const reviewedAt = new Date()
    const tracks = await prisma.$transaction(async tx => {
      const beforeTracks = await tx.track.findMany({
        where: {
          id: {
            in: input.trackIds
          }
        },
        include: trackReviewInclude
      })

      if (beforeTracks.length !== input.trackIds.length) {
        throw createValidationError('One or more selected tracks could not be found')
      }

      const nonPendingTracks = beforeTracks.filter(track => track.moderationStatus !== 'PENDING')

      if (nonPendingTracks.length > 0) {
        throw createValidationError('Only pending tracks can be moderated in bulk')
      }

      const updatedTracks = []

      for (const before of beforeTracks) {
        const after = await tx.track.update({
          where: {
            id: before.id
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
            entityId: before.id,
            metadata: {
              decision: input.decision,
              notesProvided: Boolean(input.moderationNotes),
              route: '/api/admin/tracks/bulk-moderation',
              ...buildTrackModerationChangeMetadata({
                before,
                after
              })
            }
          })
        })

        await applyReleaseDependencyModerationUpdates({
          actorId: user.id,
          decision: input.decision,
          releaseItems: before.releaseItems,
          route: '/api/admin/tracks/bulk-moderation',
          trackId: before.id,
          tx
        })

        updatedTracks.push(await tx.track.findUnique({
          where: {
            id: before.id
          },
          include: trackReviewInclude
        }))
      }

      const uploadBatchIds = [...new Set(
        beforeTracks
          .map(track => track.uploadBatchId)
          .filter(Boolean)
      )]

      for (const uploadBatchId of uploadBatchIds) {
        const beforeBatch = await tx.uploadBatch.findUnique({
          where: {
            id: uploadBatchId
          },
          include: {
            tracks: {
              select: {
                moderationStatus: true,
                processingStatus: true
              }
            }
          }
        })

        const nextStatus = getUploadBatchStatusAfterModeration(beforeBatch)

        if (beforeBatch && beforeBatch.status !== nextStatus) {
          const afterBatch = await tx.uploadBatch.update({
            where: {
              id: beforeBatch.id
            },
            data: {
              completedAt: nextStatus === 'COMPLETED' ? reviewedAt : beforeBatch.completedAt,
              status: nextStatus
            }
          })

          if (nextStatus === 'COMPLETED') {
            await tx.auditEvent.create({
              data: buildAuditEventData({
                action: auditActions.uploadBatchModerationCompleted,
                actorId: user.id,
                entityType: 'UploadBatch',
                entityId: beforeBatch.id,
                metadata: {
                  after: {
                    status: afterBatch.status
                  },
                  before: {
                    status: beforeBatch.status
                  },
                  route: '/api/admin/tracks/bulk-moderation',
                  trackCount: beforeBatch.tracks.length
                }
              })
            })
          }
        }
      }

      return updatedTracks
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      decision: input.decision,
      trackCount: tracks.length
    })

    return jsonResponse(200, {
      tracks: tracks.map(toTrackReviewItem),
      updatedCount: tracks.length
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
