export const maxUploadBatchTracks = 50

export const uploadBatchLimitMessage = `Upload batches can contain up to ${maxUploadBatchTracks} tracks. Start a new batch for additional files.`

export const uploadBatchSubmitBlockers = {
  empty: 'Add at least one uploaded track before submitting this batch.',
  failed: 'Resolve or remove failed tracks before submitting this batch.',
  processing: 'Wait for every track in the batch to finish processing before submitting it.'
}

export const getUploadBatchSubmitBlocker = summary => {
  if (!summary || summary.totalTracks === 0) {
    return uploadBatchSubmitBlockers.empty
  }

  if (summary.failedTracks > 0) {
    return uploadBatchSubmitBlockers.failed
  }

  if (summary.readyTracks !== summary.totalTracks) {
    return uploadBatchSubmitBlockers.processing
  }

  return ''
}
