export const parseReviewMetricsWindowDays = value => {
  const parsed = Number(value || 30)

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 365) {
    throw new Error('ADMIN_ACCESS_REVIEW_METRICS_WINDOW_DAYS must be an integer between 1 and 365')
  }

  return parsed
}

export const parseReviewOverdueHours = value => {
  const parsed = Number(value || 24)

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 720) {
    throw new Error('ADMIN_ACCESS_REVIEW_OVERDUE_HOURS must be an integer between 1 and 720')
  }

  return parsed
}

export const getReviewDurationMinutes = request => {
  if (!request?.createdAt || !request?.reviewedAt) {
    return null
  }

  const createdAt = new Date(request.createdAt).getTime()
  const reviewedAt = new Date(request.reviewedAt).getTime()

  if (!Number.isFinite(createdAt) || !Number.isFinite(reviewedAt) || reviewedAt < createdAt) {
    return null
  }

  return Math.round((reviewedAt - createdAt) / 60000)
}

export const summarizeAccessReviewMetrics = ({
  requests,
  now = new Date(),
  overdueHours = 24,
  recurringTargetThreshold = 2
}) => {
  const nowTime = new Date(now).getTime()
  const overdueMs = overdueHours * 60 * 60 * 1000
  const reviewedDurations = requests
    .map(getReviewDurationMinutes)
    .filter(duration => duration !== null)
  const countsByStatus = requests.reduce(
    (counts, request) => ({
      ...counts,
      [request.status]: (counts[request.status] || 0) + 1
    }),
    {}
  )
  const pendingRequests = requests.filter(request => request.status === 'PENDING')
  const targetCounts = requests.reduce((counts, request) => {
    if (!request.targetUserId) {
      return counts
    }

    counts[request.targetUserId] = (counts[request.targetUserId] || 0) + 1
    return counts
  }, {})

  return {
    total: requests.length,
    pending: countsByStatus.PENDING || 0,
    approved: countsByStatus.APPROVED || 0,
    rejected: countsByStatus.REJECTED || 0,
    overduePending: pendingRequests.filter(request => {
      const createdAt = new Date(request.createdAt).getTime()

      return Number.isFinite(createdAt) && nowTime - createdAt >= overdueMs
    }).length,
    averageReviewMinutes:
      reviewedDurations.length > 0
        ? Math.round(reviewedDurations.reduce((total, duration) => total + duration, 0) / reviewedDurations.length)
        : null,
    maxReviewMinutes:
      reviewedDurations.length > 0
        ? Math.max(...reviewedDurations)
        : null,
    recurringTargetUserIds: Object.entries(targetCounts)
      .filter(([, count]) => count >= recurringTargetThreshold)
      .map(([targetUserId, count]) => ({
        targetUserId,
        count
      }))
  }
}
