import { createValidationError } from './api-core.mjs'
import { formatPricePence } from '../pricing-policy.mjs'

export const catalogueReleaseStatuses = {
  archived: 'ARCHIVED',
  draft: 'DRAFT',
  needsChanges: 'NEEDS_CHANGES',
  published: 'PUBLISHED',
  rejected: 'REJECTED',
  submitted: 'SUBMITTED'
}

export const catalogueReleaseStatusLabels = {
  [catalogueReleaseStatuses.archived]: 'Archived',
  [catalogueReleaseStatuses.draft]: 'Draft',
  [catalogueReleaseStatuses.needsChanges]: 'Needs changes',
  [catalogueReleaseStatuses.published]: 'Published',
  [catalogueReleaseStatuses.rejected]: 'Rejected',
  [catalogueReleaseStatuses.submitted]: 'Submitted for review'
}

export const catalogueReleaseStatusDescriptions = {
  [catalogueReleaseStatuses.archived]: 'This release is no longer listed, but existing buyer access is preserved.',
  [catalogueReleaseStatuses.draft]: 'This release can still be edited before it is submitted.',
  [catalogueReleaseStatuses.needsChanges]: 'Admin review requested changes. Edit and resubmit this release when ready.',
  [catalogueReleaseStatuses.published]: 'This release is live in the catalogue.',
  [catalogueReleaseStatuses.rejected]: 'This release was rejected and is locked from further catalogue changes.',
  [catalogueReleaseStatuses.submitted]: 'This release is waiting for admin review and is not public yet.'
}

const editableReleaseStatuses = new Set([
  catalogueReleaseStatuses.draft,
  catalogueReleaseStatuses.needsChanges,
  catalogueReleaseStatuses.published
])

const publicReleaseStatuses = new Set([
  catalogueReleaseStatuses.published
])

const repairedReleaseStatuses = new Set([
  catalogueReleaseStatuses.published,
  catalogueReleaseStatuses.submitted
])

const terminalReleaseStatuses = new Set([
  catalogueReleaseStatuses.archived,
  catalogueReleaseStatuses.rejected
])

const isReadyPublishedTrack = track => (
  track?.moderationStatus === 'APPROVED' &&
  track?.processingStatus === 'READY' &&
  track?.status === 'PUBLISHED'
)

export const canEditWorksCollection = collection => editableReleaseStatuses.has(collection?.status)

export const isPublicWorksCollectionStatus = status => publicReleaseStatuses.has(status)

export const isTerminalWorksCollectionStatus = status => terminalReleaseStatuses.has(status)

export const getWorksCollectionRepairAuditMetadata = ({
  after,
  before,
  trackIds = []
}) => {
  if (before?.status !== catalogueReleaseStatuses.needsChanges || !repairedReleaseStatuses.has(after?.status)) {
    return null
  }

  const blockedDependencyTrackIds = (before.tracks || [])
    .filter(item => !isReadyPublishedTrack(item.track))
    .map(item => item.track?.id || item.trackId)
    .filter(Boolean)

  return {
    after: {
      pricingReviewStatus: after.pricingReviewStatus,
      status: after.status,
      trackCount: after.tracks?.length || trackIds.length
    },
    before: {
      blockedDependencyCount: blockedDependencyTrackIds.length,
      pricingReviewStatus: before.pricingReviewStatus,
      status: before.status,
      trackCount: before.tracks?.length || 0
    },
    blockedDependencyTrackIds,
    trackIds
  }
}

export const getInitialWorksCollectionStatus = ({ pricingReviewStatus }) => (
  pricingReviewStatus === 'NEEDS_REVIEW'
    ? catalogueReleaseStatuses.submitted
    : catalogueReleaseStatuses.published
)

export const getWorksCollectionStatusAfterPricingDecision = decision => (
  decision === 'approve'
    ? catalogueReleaseStatuses.published
    : catalogueReleaseStatuses.needsChanges
)

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

export const getWorksCollectionPriceContext = collection => {
  const individualTracksTotalPence = (collection?.tracks || []).reduce((total, item) => (
    total + Number(item.track?.pricePence || 0)
  ), 0)
  const savingsPence = Math.max(0, individualTracksTotalPence - Number(collection?.pricePence || 0))

  return {
    formattedIndividualTracksTotal: formatPricePence(individualTracksTotalPence),
    formattedSavings: formatPricePence(savingsPence),
    individualTracksTotalPence,
    savingsPence
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
