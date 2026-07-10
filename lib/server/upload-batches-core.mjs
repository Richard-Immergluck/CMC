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
  const defaultPricePence = Number.isInteger(Number(input?.defaultPricePence))
    ? Number(input.defaultPricePence)
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
