import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canEditUploadBatch,
  isTerminalUploadBatch,
  normalizeUploadBatchDefaults,
  summarizeUploadBatch,
  uploadBatchStatuses
} from '../lib/server/upload-batches-core.mjs'

test('upload batch defaults trim optional metadata and normalize prices', () => {
  assert.deepEqual(
    normalizeUploadBatchDefaults({
      label: '  Summer opera uploads  ',
      defaultComposer: '  Mozart ',
      defaultInstrumentation: '',
      defaultPricePence: '599'
    }),
    {
      label: 'Summer opera uploads',
      defaultComposer: 'Mozart',
      defaultInstrumentation: null,
      defaultPricePence: 599
    }
  )
})

test('upload batch editability protects submitted and terminal batches', () => {
  assert.equal(canEditUploadBatch({ status: uploadBatchStatuses.draft }), true)
  assert.equal(canEditUploadBatch({ status: uploadBatchStatuses.readyForReview }), true)
  assert.equal(canEditUploadBatch({ status: uploadBatchStatuses.submitted }), false)
  assert.equal(canEditUploadBatch({ status: uploadBatchStatuses.completed }), false)
  assert.equal(isTerminalUploadBatch({ status: uploadBatchStatuses.completed }), true)
  assert.equal(isTerminalUploadBatch({ status: uploadBatchStatuses.archived }), true)
})

test('upload batch summaries count processing and moderation states', () => {
  assert.deepEqual(
    summarizeUploadBatch({
      tracks: [
        {
          moderationStatus: 'PENDING',
          processingStatus: 'READY'
        },
        {
          moderationStatus: 'APPROVED',
          processingStatus: 'READY'
        },
        {
          moderationStatus: 'REJECTED',
          processingStatus: 'FAILED'
        }
      ]
    }),
    {
      approvedTracks: 1,
      failedTracks: 1,
      pendingReviewTracks: 1,
      readyTracks: 2,
      totalTracks: 3
    }
  )
})
