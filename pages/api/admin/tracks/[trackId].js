import {
  createNotFoundError,
  handleApiError,
  requireCurrentUser,
  requireMethod,
  sendJson
} from '../../../../lib/server/api'
import {
  buildTrackModerationChangeMetadata,
  toTrackReviewItem
} from '../../../../lib/server/admin-core.mjs'
import { auditActions } from '../../../../lib/server/audit-core.mjs'
import { recordAuditEvent } from '../../../../lib/server/audit'
import { requireSupportPermission } from '../../../../lib/server/permissions.mjs'
import prisma from '../../../../lib/server/prisma'
import {
  adminTrackModerationBodySchema,
  trackIdParamSchema,
  validateInput
} from '../../../../lib/validation/api.mjs'

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

export default async function handler(req, res) {
  try {
    requireMethod(req, res, ['PATCH'])

    const user = await requireCurrentUser(req)
    requireSupportPermission(user)

    const { trackId } = validateInput(trackIdParamSchema, req.query, 'Invalid track id')
    const input = validateInput(
      adminTrackModerationBodySchema,
      req.body,
      'Invalid track moderation request'
    )

    const before = await prisma.track.findUnique({
      where: {
        id: trackId
      },
      include: {
        uploadedBy: true
      }
    })

    if (!before) {
      throw createNotFoundError('Track not found')
    }

    const after = await prisma.track.update({
      where: {
        id: trackId
      },
      data: {
        ...decisionData[input.decision],
        moderationNotes: input.moderationNotes,
        reviewedAt: new Date(),
        publishedAt: input.decision === 'approve' ? new Date() : before.publishedAt
      },
      include: {
        uploadedBy: true
      }
    })

    await recordAuditEvent({
      action: auditActions.trackModerationUpdated,
      actorId: user.id,
      entityType: 'Track',
      entityId: trackId,
      metadata: {
        decision: input.decision,
        notesProvided: Boolean(input.moderationNotes),
        ...buildTrackModerationChangeMetadata({
          before,
          after
        })
      }
    })

    return sendJson(res, 200, {
      track: toTrackReviewItem(after)
    })
  } catch (error) {
    return handleApiError(res, error, req)
  }
}
