import { auditEventCategories } from './admin-core.mjs'

const toValue = value => {
  if (value === null || value === undefined) {
    return ''
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  return String(value)
}

export const escapeCsvValue = value => {
  const stringValue = toValue(value)

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`
  }

  return stringValue
}

export const toSecurityReportRows = ({
  dashboard,
  generatedAt = new Date()
}) => {
  const auditCounts = dashboard?.auditActionCounts || {}
  const reviewMetrics = dashboard?.accessReviewMetrics || {}
  const accountLifecycleSummary = dashboard?.accountLifecycleSummary || {}
  const auditRetentionStatus = dashboard?.auditRetentionStatus || {}
  const recentAuditEvents = dashboard?.recentAuditEvents || []
  const accountLifecycleTotal = auditEventCategories.accountLifecycle.reduce((total, action) => {
    return total + (Number(auditCounts[action]) || 0)
  }, 0)
  const rows = [
    {
      category: 'report',
      name: 'generatedAt',
      value: toValue(generatedAt)
    },
    {
      category: 'dashboard',
      name: 'severity',
      value: dashboard?.severity || 'unknown'
    },
    {
      category: 'dashboard',
      name: 'windowDays',
      value: dashboard?.windowDays
    },
    {
      category: 'dashboard',
      name: 'overdueHours',
      value: dashboard?.overdueHours
    },
    {
      category: 'accessReview',
      name: 'pending',
      value: reviewMetrics.pending || 0
    },
    {
      category: 'accessReview',
      name: 'overduePending',
      value: reviewMetrics.overduePending || 0
    },
    {
      category: 'accessReview',
      name: 'averageReviewMinutes',
      value: reviewMetrics.averageReviewMinutes
    },
    {
      category: 'accessReview',
      name: 'maxReviewMinutes',
      value: reviewMetrics.maxReviewMinutes
    },
    {
      category: 'accountLifecycle',
      name: 'totalEvents',
      value: accountLifecycleTotal
    },
    {
      category: 'accountLifecycle',
      name: 'status',
      value: accountLifecycleSummary.status || 'unknown'
    },
    {
      category: 'accountLifecycle',
      name: 'inactiveAccounts',
      value: accountLifecycleSummary.inactiveAccounts || 0
    },
    {
      category: 'accountLifecycle',
      name: 'suspendedAccounts',
      value: accountLifecycleSummary.accounts?.suspended || 0
    },
    {
      category: 'accountLifecycle',
      name: 'closedAccounts',
      value: accountLifecycleSummary.accounts?.closed || 0
    },
    {
      category: 'accountLifecycle',
      name: 'rejectionEvents',
      value: accountLifecycleSummary.rejectionEvents || 0
    },
    {
      category: 'auditRetention',
      name: 'status',
      value: auditRetentionStatus.status || 'unknown'
    },
    {
      category: 'auditRetention',
      name: 'retentionDays',
      value: auditRetentionStatus.retentionDays
    },
    {
      category: 'auditRetention',
      name: 'cleanupCandidateCount',
      value: auditRetentionStatus.cleanupCandidateCount || 0
    },
    {
      category: 'auditRetention',
      name: 'oldestAuditEventCreatedAt',
      value: auditRetentionStatus.oldestAuditEventCreatedAt
    },
    {
      category: 'auditRetention',
      name: 'oldestAuditEventAgeDays',
      value: auditRetentionStatus.oldestAuditEventAgeDays
    }
  ]

  for (const [action, count] of Object.entries(auditCounts)) {
    rows.push({
      category: 'auditSignal',
      name: action,
      value: count
    })
  }

  recentAuditEvents.forEach((event, index) => {
    rows.push({
      category: 'recentSecurityEvent',
      name: `event${index + 1}`,
      value: [
        event.action,
        event.actor?.email || 'system',
        `${event.entityType}#${event.entityId}`,
        event.createdAt
      ].map(toValue).join(' | ')
    })
  })

  return rows
}

export const toSecurityReportCsv = rows => {
  const headers = ['category', 'name', 'value']
  const csvRows = [
    headers.join(','),
    ...rows.map(row => headers.map(header => escapeCsvValue(row[header])).join(','))
  ]

  return `${csvRows.join('\n')}\n`
}
