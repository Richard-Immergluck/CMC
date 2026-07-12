import {
  getUploadBatchSubmitBlocker,
  maxUploadBatchTracks,
  uploadBatchLimitMessage
} from '../upload-batch-policy.mjs'

export const uploadBatchStatuses = {
  draft: 'DRAFT',
  uploading: 'UPLOADING',
  readyForReview: 'READY_FOR_REVIEW',
  submitted: 'SUBMITTED',
  partiallyFailed: 'PARTIALLY_FAILED',
  completed: 'COMPLETED',
  archived: 'ARCHIVED'
}

const editableStatuses = new Set([
  uploadBatchStatuses.draft,
  uploadBatchStatuses.uploading,
  uploadBatchStatuses.readyForReview,
  uploadBatchStatuses.partiallyFailed
])

const terminalStatuses = new Set([
  uploadBatchStatuses.completed,
  uploadBatchStatuses.archived
])

const trimOptional = value => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  return trimmed || null
}

export const normalizeUploadBatchDefaults = input => {
  const parsedDefaultPricePence = Number(input?.defaultPricePence)
  const defaultPricePence = Number.isInteger(parsedDefaultPricePence) && parsedDefaultPricePence > 0
    ? parsedDefaultPricePence
    : null

  return {
    label: trimOptional(input?.label),
    defaultComposer: trimOptional(input?.defaultComposer),
    defaultInstrumentation: trimOptional(input?.defaultInstrumentation),
    defaultPricePence
  }
}

export const canEditUploadBatch = batch => editableStatuses.has(batch?.status)

export const isTerminalUploadBatch = batch => terminalStatuses.has(batch?.status)

export const summarizeUploadBatch = batch => {
  const tracks = batch?.tracks || []
  const totalTracks = tracks.length
  const readyTracks = tracks.filter(track => track.processingStatus === 'READY').length
  const failedTracks = tracks.filter(track => track.processingStatus === 'FAILED').length
  const pendingReviewTracks = tracks.filter(track => track.moderationStatus === 'PENDING').length
  const approvedTracks = tracks.filter(track => track.moderationStatus === 'APPROVED').length

  return {
    approvedTracks,
    failedTracks,
    pendingReviewTracks,
    readyTracks,
    totalTracks
  }
}

export const buildUploadBatchDiagnostics = batch => {
  const summary = summarizeUploadBatch(batch)
  const blockerCodes = []

  if (summary.totalTracks === 0) {
    blockerCodes.push('empty_batch')
  }

  if (summary.failedTracks > 0) {
    blockerCodes.push('failed_tracks')
  }

  if (summary.readyTracks < summary.totalTracks && summary.failedTracks === 0) {
    blockerCodes.push('processing_incomplete')
  }

  if (summary.pendingReviewTracks > 0 && batch?.status === uploadBatchStatuses.submitted) {
    blockerCodes.push('awaiting_moderation')
  }

  if ((batch?._count?.tracks ?? summary.totalTracks) >= maxUploadBatchTracks) {
    blockerCodes.push('batch_capacity_full')
  }

  return {
    blockerCodes,
    canSubmit: getUploadBatchSubmitBlocker(summary) === '',
    requiresAttention: summary.failedTracks > 0 || batch?.status === uploadBatchStatuses.partiallyFailed,
    supportPriority: summary.failedTracks > 0 ? 'review' : 'normal'
  }
}

export const canSubmitUploadBatch = batch => {
  const summary = summarizeUploadBatch(batch)

  return getUploadBatchSubmitBlocker(summary) === ''
}

export const canAddTrackToUploadBatch = batch => {
  const currentTrackCount = batch?._count?.tracks ?? batch?.tracks?.length ?? 0

  return canEditUploadBatch(batch) && currentTrackCount < maxUploadBatchTracks
}

export const getUploadBatchStatusAfterFailedTrackRemoval = batch => {
  const summary = summarizeUploadBatch(batch)

  if (summary.totalTracks === 0) {
    return uploadBatchStatuses.draft
  }

  if (summary.failedTracks > 0) {
    return uploadBatchStatuses.partiallyFailed
  }

  if (summary.readyTracks === summary.totalTracks) {
    return uploadBatchStatuses.readyForReview
  }

  return uploadBatchStatuses.uploading
}

export const getUploadBatchStatusAfterModeration = batch => {
  const summary = summarizeUploadBatch(batch)

  if (summary.totalTracks === 0) {
    return uploadBatchStatuses.draft
  }

  if (summary.failedTracks > 0) {
    return uploadBatchStatuses.partiallyFailed
  }

  if (summary.pendingReviewTracks === 0) {
    return uploadBatchStatuses.completed
  }

  return batch?.status || uploadBatchStatuses.submitted
}

export {
  getUploadBatchSubmitBlocker,
  maxUploadBatchTracks,
  uploadBatchLimitMessage
}
