import assert from 'node:assert/strict'
import test from 'node:test'
import {
  escapeCsvValue,
  toSecurityReportCsv,
  toSecurityReportRows
} from '../lib/server/security-report-core.mjs'

test('CSV values escape commas, quotes, and newlines', () => {
  assert.equal(escapeCsvValue('plain'), 'plain')
  assert.equal(escapeCsvValue('needs,escape'), '"needs,escape"')
  assert.equal(escapeCsvValue('quote "here"'), '"quote ""here"""')
  assert.equal(escapeCsvValue('line\nbreak'), '"line\nbreak"')
})

test('security report rows flatten dashboard data for export', () => {
  const rows = toSecurityReportRows({
    generatedAt: new Date('2026-06-30T13:00:00.000Z'),
    dashboard: {
      severity: 'high',
      windowDays: 30,
      overdueHours: 24,
      auditActionCounts: {
        'auth.inactive_api_rejected': 4,
        'auth.sign_in_denied': 2,
        'auth.sign_out': 3,
        'track_access.denied': 10,
        'user_access.updated': 1
      },
      accessReviewMetrics: {
        pending: 2,
        overduePending: 1,
        averageReviewMinutes: 90,
        maxReviewMinutes: 120
      },
      auditRetentionStatus: {
        status: 'review',
        retentionDays: 365,
        cleanupCandidateCount: 4,
        oldestAuditEventCreatedAt: '2025-01-01T00:00:00.000Z',
        oldestAuditEventAgeDays: 545
      },
      recentAuditEvents: [
        {
          action: 'track_access.denied',
          actor: {
            email: 'admin@example.com'
          },
          entityType: 'Track',
          entityId: '42',
          createdAt: '2026-06-30T12:55:00.000Z'
        }
      ]
    }
  })

  assert.deepEqual(rows.slice(0, 5), [
    {
      category: 'report',
      name: 'generatedAt',
      value: '2026-06-30T13:00:00.000Z'
    },
    {
      category: 'dashboard',
      name: 'severity',
      value: 'high'
    },
    {
      category: 'dashboard',
      name: 'windowDays',
      value: 30
    },
    {
      category: 'dashboard',
      name: 'overdueHours',
      value: 24
    },
    {
      category: 'accessReview',
      name: 'pending',
      value: 2
    }
  ])
  assert.ok(rows.some(row => row.category === 'auditSignal' && row.name === 'track_access.denied'))
  assert.ok(rows.some(row => row.category === 'accountLifecycle' && row.name === 'totalEvents' && row.value === 10))
  assert.ok(rows.some(row => row.category === 'auditRetention' && row.name === 'status' && row.value === 'review'))
  assert.ok(rows.some(row => row.category === 'auditRetention' && row.name === 'cleanupCandidateCount' && row.value === 4))
  assert.ok(rows.some(row => row.category === 'recentSecurityEvent' && row.value.includes('admin@example.com')))
})

test('security report CSV contains stable headers and rows', () => {
  assert.equal(
    toSecurityReportCsv([
      {
        category: 'dashboard',
        name: 'severity',
        value: 'normal'
      }
    ]),
    'category,name,value\ndashboard,severity,normal\n'
  )
})
