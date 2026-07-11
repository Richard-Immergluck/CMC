import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canAddTrackToUploadBatch,
  canEditUploadBatch,
  canSubmitUploadBatch,
  getUploadBatchSubmitBlocker,
  isTerminalUploadBatch,
  maxUploadBatchTracks,
  normalizeUploadBatchDefaults,
  summarizeUploadBatch,
  uploadBatchLimitMessage,
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
  assert.match(
    getUploadBatchSubmitBlocker(summarizeUploadBatch({ tracks: [] })),
    /Add at least one uploaded track/
  )
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
    getUploadBatchSubmitBlocker(summarizeUploadBatch({
      tracks: [
        {
          processingStatus: 'READY'
        }
      ]
    })),
    ''
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
  assert.match(
    getUploadBatchSubmitBlocker(summarizeUploadBatch({
      tracks: [
        {
          processingStatus: 'READY'
        },
        {
          processingStatus: 'FAILED'
        }
      ]
    })),
    /Resolve or remove failed tracks/
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
  assert.match(
    getUploadBatchSubmitBlocker(summarizeUploadBatch({
      tracks: [
        {
          processingStatus: 'PROCESSING'
        }
      ]
    })),
    /finish processing/
  )
})

test('upload batch additions are capped at the platform maximum', () => {
  assert.equal(maxUploadBatchTracks, 50)
  assert.match(uploadBatchLimitMessage, /50 tracks/)
  assert.equal(
    canAddTrackToUploadBatch({
      status: uploadBatchStatuses.readyForReview,
      tracks: Array.from({ length: maxUploadBatchTracks - 1 })
    }),
    true
  )
  assert.equal(
    canAddTrackToUploadBatch({
      status: uploadBatchStatuses.readyForReview,
      tracks: Array.from({ length: maxUploadBatchTracks })
    }),
    false
  )
  assert.equal(
    canAddTrackToUploadBatch({
      _count: {
        tracks: maxUploadBatchTracks
      },
      status: uploadBatchStatuses.readyForReview
    }),
    false
  )
  assert.equal(
    canAddTrackToUploadBatch({
      _count: {
        tracks: 1
      },
      status: uploadBatchStatuses.submitted
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
