export const getAdminBatchReviewGuidance = batch => {
  const summary = batch?.summary || {}
  const status = batch?.status || 'UNKNOWN'
  const totalTracks = summary.totalTracks || 0
  const pendingReviewTracks = summary.pendingReviewTracks || 0
  const failedTracks = summary.failedTracks || 0

  if (totalTracks === 0) {
    return {
      actionable: false,
      body: 'There are no tracks attached to this batch yet. No operator review is available.',
      title: 'Empty batch',
      variant: 'secondary'
    }
  }

  if (failedTracks > 0) {
    return {
      actionable: pendingReviewTracks > 0,
      body: pendingReviewTracks > 0
        ? 'Review the pending tracks, but the failed uploads still need uploader action before the batch can be considered clean.'
        : 'All reviewable tracks have been handled, but failed uploads remain. The uploader needs to remove or re-upload those files.',
      title: 'Uploader action needed',
      variant: 'warning'
    }
  }

  if (pendingReviewTracks > 0) {
    return {
      actionable: true,
      body: `There ${pendingReviewTracks === 1 ? 'is' : 'are'} ${pendingReviewTracks} pending track${pendingReviewTracks === 1 ? '' : 's'} ready for an operator decision.`,
      title: 'Ready for review',
      variant: 'info'
    }
  }

  if (status === 'COMPLETED') {
    return {
      actionable: false,
      body: 'Every track in this batch has been reviewed and the import is closed.',
      title: 'Batch complete',
      variant: 'success'
    }
  }

  return {
    actionable: false,
    body: 'No pending tracks are available for review in this batch.',
    title: 'No pending review work',
    variant: 'secondary'
  }
}
