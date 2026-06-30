import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildSecurityDashboardSummary,
  getAccessReviewBadge,
  getSecurityDashboardSeverity,
  securityDashboardAuditActions,
  toAuditActionCounts
} from '../lib/server/security-dashboard-core.mjs'

test('audit action counts include known security actions with zero defaults', () => {
  const counts = toAuditActionCounts([
    {
      action: 'track_access.denied',
      _count: {
        _all: 7
      }
    },
    {
      action: 'unrelated.event',
      _count: {
        _all: 99
      }
    }
  ])

  assert.equal(counts['track_access.denied'], 7)
  assert.equal(counts['rate_limit.exceeded'], 0)
  assert.equal(counts['unrelated.event'], undefined)
  assert.ok(securityDashboardAuditActions.includes('user_access_change.requested'))
  assert.ok(securityDashboardAuditActions.includes('stripe.webhook_signature_failed'))
})

test('access review badges prioritize overdue reviews', () => {
  assert.deepEqual(
    getAccessReviewBadge({
      pending: 4,
      overduePending: 2
    }),
    {
      count: 2,
      label: '2 overdue',
      variant: 'danger'
    }
  )
  assert.deepEqual(
    getAccessReviewBadge({
      pending: 3,
      overduePending: 0
    }),
    {
      count: 3,
      label: '3 pending',
      variant: 'warning'
    }
  )
  assert.deepEqual(
    getAccessReviewBadge({
      pending: 0,
      overduePending: 0
    }),
    {
      count: 0,
      label: 'clear',
      variant: 'success'
    }
  )
})

test('security dashboard severity escalates for high risk signals', () => {
  assert.equal(
    getSecurityDashboardSeverity({
      auditActionCounts: {
        'user_access.self_update_denied': 1
      },
      accessReviewMetrics: {
        overduePending: 0,
        pending: 0
      }
    }),
    'high'
  )
  assert.equal(
    getSecurityDashboardSeverity({
      auditActionCounts: {
        'stripe.webhook_signature_failed': 1
      },
      accessReviewMetrics: {
        overduePending: 0,
        pending: 0
      }
    }),
    'high'
  )
  assert.equal(
    getSecurityDashboardSeverity({
      auditActionCounts: {
        'rate_limit.exceeded': 5
      },
      accessReviewMetrics: {
        overduePending: 0,
        pending: 0
      }
    }),
    'medium'
  )
  assert.equal(
    getSecurityDashboardSeverity({
      auditActionCounts: {},
      accessReviewMetrics: {
        overduePending: 0,
        pending: 0
      }
    }),
    'normal'
  )
})

test('security dashboard summary keeps window and event context', () => {
  const summary = buildSecurityDashboardSummary({
    auditActionCounts: {
      'track_access.denied': 10
    },
    accessReviewMetrics: {
      overduePending: 0,
      pending: 0
    },
    windowDays: 30,
    overdueHours: 24,
    recentAuditEvents: [
      {
        id: 1,
        action: 'track_access.denied'
      }
    ]
  })

  assert.deepEqual(summary, {
    windowDays: 30,
    overdueHours: 24,
    severity: 'high',
    accessReviewBadge: {
      count: 0,
      label: 'clear',
      variant: 'success'
    },
    auditActionCounts: {
      'track_access.denied': 10
    },
    accessReviewMetrics: {
      overduePending: 0,
      pending: 0
    },
    recentAuditEvents: [
      {
        id: 1,
        action: 'track_access.denied'
      }
    ]
  })
})
