import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canEditWorksCollection,
  catalogueReleaseStatuses,
  catalogueReleaseStatusDescriptions,
  catalogueReleaseStatusLabels,
  getInitialWorksCollectionStatus,
  getWorksCollectionRepairAuditMetadata,
  getWorksCollectionStatusAfterPricingDecision,
  getWorksCollectionDeleteResolution,
  isPublicWorksCollectionStatus,
  isTerminalWorksCollectionStatus,
  normalizeTrackItems
} from '../lib/server/works-collections-core.mjs'

test('works collection lifecycle statuses describe editing and public visibility', () => {
  assert.equal(canEditWorksCollection({ status: catalogueReleaseStatuses.draft }), true)
  assert.equal(canEditWorksCollection({ status: catalogueReleaseStatuses.needsChanges }), true)
  assert.equal(canEditWorksCollection({ status: catalogueReleaseStatuses.published }), true)
  assert.equal(canEditWorksCollection({ status: catalogueReleaseStatuses.submitted }), false)
  assert.equal(canEditWorksCollection({ status: catalogueReleaseStatuses.rejected }), false)
  assert.equal(canEditWorksCollection({ status: catalogueReleaseStatuses.archived }), false)
  assert.equal(isPublicWorksCollectionStatus(catalogueReleaseStatuses.published), true)
  assert.equal(isPublicWorksCollectionStatus(catalogueReleaseStatuses.submitted), false)
  assert.equal(isTerminalWorksCollectionStatus(catalogueReleaseStatuses.rejected), true)
  assert.equal(isTerminalWorksCollectionStatus(catalogueReleaseStatuses.archived), true)
  assert.equal(getInitialWorksCollectionStatus({ pricingReviewStatus: 'NEEDS_REVIEW' }), catalogueReleaseStatuses.submitted)
  assert.equal(getInitialWorksCollectionStatus({ pricingReviewStatus: 'AUTO_APPROVED' }), catalogueReleaseStatuses.published)
  assert.equal(getWorksCollectionStatusAfterPricingDecision('approve'), catalogueReleaseStatuses.published)
  assert.equal(getWorksCollectionStatusAfterPricingDecision('reject'), catalogueReleaseStatuses.needsChanges)
  assert.equal(catalogueReleaseStatusLabels[catalogueReleaseStatuses.submitted], 'Submitted for review')
  assert.match(catalogueReleaseStatusDescriptions[catalogueReleaseStatuses.needsChanges], /Edit and resubmit/)
})

test('normalizeTrackItems sorts positions and rejects duplicate tracks', () => {
  assert.deepEqual(
    normalizeTrackItems({
      trackItems: [
        {
          position: 2,
          titleInWork: 'Second',
          trackId: 20
        },
        {
          movementNo: 'I',
          position: 1,
          titleInWork: 'First',
          trackId: 10
        }
      ]
    }),
    [
      {
        movementNo: 'I',
        position: 1,
        titleInWork: 'First',
        trackId: 10
      },
      {
        movementNo: null,
        position: 2,
        titleInWork: 'Second',
        trackId: 20
      }
    ]
  )

  assert.throws(
    () => normalizeTrackItems({
      trackIds: [10, 10]
    }),
    error => error.statusCode === 400
  )
})

test('works collection delete resolution preserves sold release history', () => {
  assert.deepEqual(
    getWorksCollectionDeleteResolution({
      _count: {
        orderItems: 0,
        trackOwners: 0
      }
    }),
    {
      action: 'delete',
      hasCommerceHistory: false,
      orderItemCount: 0,
      trackOwnerCount: 0
    }
  )

  assert.deepEqual(
    getWorksCollectionDeleteResolution({
      _count: {
        orderItems: 2,
        trackOwners: 5
      }
    }),
    {
      action: 'archive',
      hasCommerceHistory: true,
      orderItemCount: 2,
      trackOwnerCount: 5
    }
  )
})

test('works collection repair audit metadata captures safe lifecycle context', () => {
  assert.deepEqual(
    getWorksCollectionRepairAuditMetadata({
      before: {
        pricingReviewStatus: 'APPROVED',
        status: catalogueReleaseStatuses.needsChanges,
        tracks: [
          {
            track: {
              id: 10,
              moderationStatus: 'REJECTED',
              processingStatus: 'READY',
              status: 'PUBLISHED'
            }
          },
          {
            track: {
              id: 20,
              moderationStatus: 'APPROVED',
              processingStatus: 'READY',
              status: 'PUBLISHED'
            }
          }
        ]
      },
      after: {
        pricingReviewStatus: 'AUTO_APPROVED',
        status: catalogueReleaseStatuses.published,
        tracks: [
          {
            track: {
              id: 20
            }
          },
          {
            track: {
              id: 30
            }
          }
        ]
      },
      trackIds: [20, 30]
    }),
    {
      after: {
        pricingReviewStatus: 'AUTO_APPROVED',
        status: 'PUBLISHED',
        trackCount: 2
      },
      before: {
        blockedDependencyCount: 1,
        pricingReviewStatus: 'APPROVED',
        status: 'NEEDS_CHANGES',
        trackCount: 2
      },
      blockedDependencyTrackIds: [10],
      trackIds: [20, 30]
    }
  )

  assert.equal(
    getWorksCollectionRepairAuditMetadata({
      before: {
        status: catalogueReleaseStatuses.published
      },
      after: {
        status: catalogueReleaseStatuses.published
      },
      trackIds: [20, 30]
    }),
    null
  )
})
