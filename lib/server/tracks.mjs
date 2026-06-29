import prisma from './prisma.js'
import {
  auditActions,
  buildAuditEventData,
  buildTrackSubmittedMetadata
} from './audit-core.mjs'
import { toTrackCreateData } from './tracks-core.mjs'

export { createDownloadName, normalizeTrackPrice, toTrackCreateData } from './tracks-core.mjs'

export const createUploadedTrack = ({ input, user }) => {
  return prisma.$transaction(async tx => {
    const track = await tx.track.create({
      data: toTrackCreateData({ input, user })
    })

    await tx.auditEvent.create({
      data: buildAuditEventData({
        action: auditActions.trackSubmitted,
        actorId: user.id,
        entityType: 'Track',
        entityId: track.id,
        metadata: buildTrackSubmittedMetadata({
          currency: track.currency,
          hasAdditionalInfo: track.additionalInfo,
          pricePence: track.pricePence,
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
