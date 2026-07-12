import assert from 'node:assert/strict'
import test from 'node:test'
import { getAdminBatchReviewGuidance } from '../lib/admin-batch-review-guidance.mjs'

test('admin batch review guidance blocks empty batches', () => {
  assert.deepEqual(
    getAdminBatchReviewGuidance({
      status: 'DRAFT',
      summary: {
        totalTracks: 0
      }
    }),
    {
      actionable: false,
      body: 'There are no tracks attached to this batch yet. No operator review is available.',
      title: 'Empty batch',
      variant: 'secondary'
    }
  )
})

test('admin batch review guidance identifies pending review work', () => {
  assert.deepEqual(
    getAdminBatchReviewGuidance({
      status: 'SUBMITTED',
      summary: {
        failedTracks: 0,
        pendingReviewTracks: 2,
        totalTracks: 3
      }
    }),
    {
      actionable: true,
      body: 'There are 2 pending tracks ready for an operator decision.',
      title: 'Ready for review',
      variant: 'info'
    }
  )
})

test('admin batch review guidance prioritizes failed uploads', () => {
  assert.deepEqual(
    getAdminBatchReviewGuidance({
      status: 'PARTIALLY_FAILED',
      summary: {
        failedTracks: 1,
        pendingReviewTracks: 0,
        totalTracks: 3
      }
    }),
    {
      actionable: false,
      body: 'All reviewable tracks have been handled, but failed uploads remain. The uploader needs to remove or re-upload those files.',
      title: 'Uploader action needed',
      variant: 'warning'
    }
  )
})

test('admin batch review guidance explains completed batches', () => {
  assert.deepEqual(
    getAdminBatchReviewGuidance({
      status: 'COMPLETED',
      summary: {
        failedTracks: 0,
        pendingReviewTracks: 0,
        totalTracks: 3
      }
    }),
    {
      actionable: false,
      body: 'Every track in this batch has been reviewed and the import is closed.',
      title: 'Batch complete',
      variant: 'success'
    }
  )
})
