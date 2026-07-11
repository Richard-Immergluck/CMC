import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canEditUploadBatch,
  canSubmitUploadBatch,
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

  assert.deepEqual(
    normalizeUploadBatchDefaults({
      defaultPricePence: null
    }),
    {
      label: null,
      defaultComposer: null,
      defaultInstrumentation: null,
      defaultPricePence: null
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

test('upload batch submission requires successful processed tracks', () => {
  assert.equal(canSubmitUploadBatch({ tracks: [] }), false)
  assert.equal(
    canSubmitUploadBatch({
      tracks: [
        {
          processingStatus: 'READY'
        }
      ]
    }),
    true
  )
  assert.equal(
    canSubmitUploadBatch({
      tracks: [
        {
          processingStatus: 'READY'
        },
        {
          processingStatus: 'FAILED'
        }
      ]
    }),
    false
  )
  assert.equal(
    canSubmitUploadBatch({
      tracks: [
        {
          processingStatus: 'PROCESSING'
        }
      ]
    }),
    false
  )
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
