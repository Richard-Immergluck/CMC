export const securityDashboardAuditActions = [
  'rate_limit.exceeded',
  'track_access.denied',
  'auth.inactive_api_rejected',
  'auth.sign_in_denied',
  'auth.sign_out',
  'user_access.self_update_denied',
  'user_access_change.requested',
  'user_access_change.approved',
  'user_access_change.rejected',
  'stripe.webhook_signature_failed'
]

export const toAuditActionCounts = groupedEvents => {
  const counts = Object.fromEntries(
    securityDashboardAuditActions.map(action => [action, 0])
  )

  for (const event of groupedEvents) {
    if (securityDashboardAuditActions.includes(event.action)) {
      counts[event.action] = event._count?._all || event.count || 0
    }
  }

  return counts
}

export const getSecurityDashboardSeverity = ({
  auditActionCounts,
  accessReviewMetrics
}) => {
  if (
    auditActionCounts['user_access.self_update_denied'] > 0 ||
    auditActionCounts['auth.inactive_api_rejected'] > 0 ||
    auditActionCounts['user_access_change.approved'] > 0 ||
    auditActionCounts['stripe.webhook_signature_failed'] > 0 ||
    auditActionCounts['track_access.denied'] >= 10 ||
    accessReviewMetrics.overduePending > 0
  ) {
    return 'high'
  }

  if (
    auditActionCounts['rate_limit.exceeded'] >= 5 ||
    auditActionCounts['auth.sign_in_denied'] >= 10 ||
    auditActionCounts['user_access_change.requested'] >= 3 ||
    accessReviewMetrics.pending > 0
  ) {
    return 'medium'
  }

  return 'normal'
}

export const getAccessReviewBadge = accessReviewMetrics => {
  const pending = accessReviewMetrics?.pending || 0
  const overdue = accessReviewMetrics?.overduePending || 0

  if (overdue > 0) {
    return {
      count: overdue,
      label: `${overdue} overdue`,
      variant: 'danger'
    }
  }

  if (pending > 0) {
    return {
      count: pending,
      label: `${pending} pending`,
      variant: 'warning'
    }
  }

  return {
    count: 0,
    label: 'clear',
    variant: 'success'
  }
}

const millisecondsPerDay = 24 * 60 * 60 * 1000

const toIsoDateString = value => {
  if (!value) {
    return null
  }

  return new Date(value).toISOString()
}

export const buildAuditRetentionStatus = ({
  cleanupCandidateCount = 0,
  oldestAuditEvent,
  retentionDays,
  now = new Date()
}) => {
  const oldestAuditEventCreatedAt = toIsoDateString(oldestAuditEvent?.createdAt)
  const oldestAuditEventAgeDays = oldestAuditEventCreatedAt
    ? Math.max(0, Math.floor((new Date(now).getTime() - new Date(oldestAuditEventCreatedAt).getTime()) / millisecondsPerDay))
    : null

  return {
    status: cleanupCandidateCount > 0 ? 'review' : 'clear',
    retentionDays,
    cleanupCandidateCount,
    oldestAuditEventCreatedAt,
    oldestAuditEventAgeDays
  }
}

export const buildSecurityDashboardSummary = ({
  auditActionCounts,
  accessReviewMetrics,
  auditRetentionStatus,
  windowDays,
  overdueHours,
  recentAuditEvents
}) => ({
  windowDays,
  overdueHours,
  severity: getSecurityDashboardSeverity({
    auditActionCounts,
    accessReviewMetrics
  }),
  accessReviewBadge: getAccessReviewBadge(accessReviewMetrics),
  auditRetentionStatus,
  auditActionCounts,
  accessReviewMetrics,
  recentAuditEvents
})
