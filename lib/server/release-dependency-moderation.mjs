import {
  auditActions,
  buildAuditEventData
} from './audit-core.mjs'
import { catalogueReleaseStatuses } from './works-collections-core.mjs'

const dependencyBlockingDecisions = new Set(['archive', 'reject'])

const statusesBlockedByRejectedDependency = new Set([
  catalogueReleaseStatuses.published,
  catalogueReleaseStatuses.submitted
])

export const isTrackModerationDecisionReleaseBlocking = decision => {
  return dependencyBlockingDecisions.has(decision)
}

export const getReleaseDependencyModerationUpdates = ({
  decision,
  releaseItems = []
}) => {
  if (!isTrackModerationDecisionReleaseBlocking(decision)) {
    return []
  }

  const releasesById = new Map()

  for (const item of releaseItems) {
    const release = item.release || item

    if (!release?.id || releasesById.has(release.id)) {
      continue
    }

    if (!statusesBlockedByRejectedDependency.has(release.status)) {
      continue
    }

    releasesById.set(release.id, {
      id: release.id,
      nextStatus: catalogueReleaseStatuses.needsChanges,
      pricingReviewStatus: release.pricingReviewStatus,
      previousStatus: release.status,
      title: release.title
    })
  }

  return [...releasesById.values()]
}

export const applyReleaseDependencyModerationUpdates = async ({
  actorId,
  decision,
  releaseItems = [],
  route,
  trackId,
  tx
}) => {
  const updates = getReleaseDependencyModerationUpdates({
    decision,
    releaseItems
  })

  for (const update of updates) {
    await tx.catalogueRelease.update({
      where: {
        id: update.id
      },
      data: {
        status: update.nextStatus
      }
    })

    await tx.auditEvent.create({
      data: buildAuditEventData({
        action: auditActions.worksCollectionDependencyBlocked,
        actorId,
        entityType: 'CatalogueRelease',
        entityId: update.id,
        metadata: {
          after: {
            status: update.nextStatus
          },
          before: {
            status: update.previousStatus
          },
          decision,
          pricingReviewStatus: update.pricingReviewStatus,
          route,
          title: update.title,
          trackId
        }
      })
    })
  }

  return updates
}
