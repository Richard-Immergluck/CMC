import assert from 'node:assert/strict'
import test from 'node:test'
import {
  batchMatchesAdminSearch,
  filterAndSortAdminUploadBatches,
  filterAndSortAdminWorksCollections,
  getAdminUploadBatchFilterCounts,
  getAdminWorksCollectionFilterCounts,
  releaseMatchesAdminSearch
} from '../lib/admin-review-filters.mjs'

test('admin upload batch search covers uploader and track context', () => {
  const batch = {
    id: 12,
    label: 'Opera import',
    status: 'SUBMITTED',
    uploader: {
      name: 'Clare Repetiteur',
      email: 'clare@example.com'
    },
    tracks: [
      {
        moderationStatus: 'PENDING',
        processingStatus: 'READY',
        status: 'DRAFT',
        title: 'Figaro Act I cue'
      }
    ]
  }

  assert.equal(batchMatchesAdminSearch({ batch, query: 'clare' }), true)
  assert.equal(batchMatchesAdminSearch({ batch, query: 'figaro' }), true)
  assert.equal(batchMatchesAdminSearch({ batch, query: 'ready' }), true)
  assert.equal(batchMatchesAdminSearch({ batch, query: 'winterreise' }), false)
})

test('admin upload batch filters and sorts support operator triage', () => {
  const batches = [
    {
      createdAt: '2026-07-10T09:00:00.000Z',
      label: 'Ready import',
      status: 'READY_FOR_REVIEW',
      summary: {
        failedTracks: 0,
        pendingReviewTracks: 0,
        totalTracks: 8
      },
      uploader: {
        email: 'ready@example.com'
      }
    },
    {
      createdAt: '2026-07-11T09:00:00.000Z',
      label: 'Failed import',
      status: 'PARTIALLY_FAILED',
      summary: {
        failedTracks: 3,
        pendingReviewTracks: 1,
        totalTracks: 12
      },
      uploader: {
        email: 'failed@example.com'
      }
    },
    {
      createdAt: '2026-07-12T09:00:00.000Z',
      label: 'Submitted import',
      status: 'SUBMITTED',
      submittedAt: '2026-07-12T10:00:00.000Z',
      summary: {
        failedTracks: 0,
        pendingReviewTracks: 12,
        totalTracks: 12
      },
      uploader: {
        email: 'submitted@example.com'
      }
    }
  ]

  assert.deepEqual(getAdminUploadBatchFilterCounts(batches), {
    active: 1,
    all: 3,
    attention: 1,
    completed: 0,
    submitted: 1
  })
  assert.deepEqual(
    filterAndSortAdminUploadBatches({
      batches,
      filter: 'attention',
      query: '',
      sort: 'attention'
    }).map(batch => batch.label),
    ['Failed import']
  )
  assert.deepEqual(
    filterAndSortAdminUploadBatches({
      batches,
      filter: 'all',
      query: '',
      sort: 'trackCount'
    }).map(batch => batch.label),
    ['Failed import', 'Submitted import', 'Ready import']
  )
})

test('admin Works and Collections search covers release uploader and track context', () => {
  const release = {
    catalogueType: 'SONG_CYCLE',
    formattedPrice: '£14.99',
    pricingReviewStatus: 'APPROVED',
    saleFormat: 'BOTH',
    status: 'PUBLISHED',
    title: 'Winterreise highlights',
    uploader: {
      email: 'uploader@example.com',
      name: 'Uploader'
    },
    tracks: [
      {
        formattedPrice: '£3.99',
        movementNo: 'No. 5',
        title: 'Der Lindenbaum'
      }
    ]
  }

  assert.equal(releaseMatchesAdminSearch({ query: 'winterreise', release }), true)
  assert.equal(releaseMatchesAdminSearch({ query: 'lindenbaum', release }), true)
  assert.equal(releaseMatchesAdminSearch({ query: 'uploader@example.com', release }), true)
  assert.equal(releaseMatchesAdminSearch({ query: 'mozart', release }), false)
})

test('admin Works and Collections filters and sorts support release triage', () => {
  const releases = [
    {
      createdAt: '2026-07-10T09:00:00.000Z',
      orderItemCount: 4,
      pricePence: 1499,
      pricingReviewStatus: 'APPROVED',
      status: 'PUBLISHED',
      title: 'Live cycle',
      trackCount: 5
    },
    {
      createdAt: '2026-07-11T09:00:00.000Z',
      orderItemCount: 0,
      pricePence: 2999,
      pricingReviewStatus: 'NEEDS_REVIEW',
      status: 'SUBMITTED',
      title: 'Review opera',
      trackCount: 8
    },
    {
      createdAt: '2026-07-12T09:00:00.000Z',
      orderItemCount: 0,
      pricePence: 999,
      pricingReviewStatus: 'REJECTED',
      status: 'NEEDS_CHANGES',
      title: 'Needs edit pack',
      trackCount: 2
    }
  ]

  assert.deepEqual(getAdminWorksCollectionFilterCounts(releases), {
    all: 3,
    archived: 0,
    live: 1,
    needsChanges: 1,
    review: 1,
    withSales: 1
  })
  assert.deepEqual(
    filterAndSortAdminWorksCollections({
      filter: 'review',
      query: '',
      releases,
      sort: 'price'
    }).map(release => release.title),
    ['Review opera']
  )
  assert.deepEqual(
    filterAndSortAdminWorksCollections({
      filter: 'all',
      query: '',
      releases,
      sort: 'sales'
    }).map(release => release.title),
    ['Live cycle', 'Needs edit pack', 'Review opera']
  )
})
