import { createValidationError } from './api-core.mjs'

export const catalogueReleaseStatuses = {
  archived: 'ARCHIVED',
  draft: 'DRAFT',
  needsChanges: 'NEEDS_CHANGES',
  published: 'PUBLISHED',
  rejected: 'REJECTED',
  submitted: 'SUBMITTED'
}

const editableReleaseStatuses = new Set([
  catalogueReleaseStatuses.draft,
  catalogueReleaseStatuses.needsChanges,
  catalogueReleaseStatuses.published
])

const publicReleaseStatuses = new Set([
  catalogueReleaseStatuses.published
])

const terminalReleaseStatuses = new Set([
  catalogueReleaseStatuses.archived,
  catalogueReleaseStatuses.rejected
])

export const canEditWorksCollection = collection => editableReleaseStatuses.has(collection?.status)

export const isPublicWorksCollectionStatus = status => publicReleaseStatuses.has(status)

export const isTerminalWorksCollectionStatus = status => terminalReleaseStatuses.has(status)

export const getWorksCollectionDeleteResolution = collection => {
  const orderItemCount = collection?._count?.orderItems || 0
  const trackOwnerCount = collection?._count?.trackOwners || 0
  const hasCommerceHistory = orderItemCount + trackOwnerCount > 0

  return {
    action: hasCommerceHistory ? 'archive' : 'delete',
    hasCommerceHistory,
    orderItemCount,
    trackOwnerCount
  }
}

export const normalizeTrackItems = input => {
  const sourceItems = input.trackItems?.length
    ? input.trackItems
    : (input.trackIds || []).map((trackId, index) => ({
      position: index + 1,
      trackId
    }))
  const trackItems = sourceItems
    .map((item, index) => ({
      movementNo: item.movementNo || null,
      position: item.position || index + 1,
      titleInWork: item.titleInWork || null,
      trackId: Number(item.trackId)
    }))
    .sort((firstItem, secondItem) => firstItem.position - secondItem.position)
    .map((item, index) => ({
      ...item,
      position: index + 1
    }))
  const trackIds = trackItems.map(item => item.trackId)
  const uniqueTrackIds = [...new Set(trackIds)]

  if (uniqueTrackIds.length !== trackIds.length) {
    throw createValidationError('Each track can only be added once')
  }

  return trackItems
}
