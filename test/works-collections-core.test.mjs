import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canEditWorksCollection,
  catalogueReleaseStatuses,
  getInitialWorksCollectionStatus,
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
