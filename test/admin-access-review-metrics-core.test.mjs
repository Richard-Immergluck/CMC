import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getReviewDurationMinutes,
  parseReviewMetricsWindowDays,
  parseReviewOverdueHours,
  summarizeAccessReviewMetrics
} from '../lib/server/admin-access-review-metrics-core.mjs'

test('review metric windows enforce bounded values', () => {
  assert.equal(parseReviewMetricsWindowDays(undefined), 30)
  assert.equal(parseReviewOverdueHours(undefined), 24)
  assert.throws(() => parseReviewMetricsWindowDays('0'), /between 1 and 365/)
  assert.throws(() => parseReviewOverdueHours('721'), /between 1 and 720/)
})

test('review duration returns rounded minutes for reviewed requests', () => {
  assert.equal(
    getReviewDurationMinutes({
      createdAt: new Date('2026-06-30T10:00:00.000Z'),
      reviewedAt: new Date('2026-06-30T11:31:00.000Z')
    }),
    91
  )
  assert.equal(
    getReviewDurationMinutes({
      createdAt: new Date('2026-06-30T11:00:00.000Z'),
      reviewedAt: new Date('2026-06-30T10:00:00.000Z')
    }),
    null
  )
})

test('access review metrics summarize status, latency, overdue, and recurring targets', () => {
  const metrics = summarizeAccessReviewMetrics({
    now: new Date('2026-06-30T12:00:00.000Z'),
    overdueHours: 24,
    requests: [
      {
        status: 'PENDING',
        targetUserId: 'user-1',
        createdAt: new Date('2026-06-29T11:00:00.000Z')
      },
      {
        status: 'PENDING',
        targetUserId: 'user-2',
        createdAt: new Date('2026-06-30T11:00:00.000Z')
      },
      {
        status: 'APPROVED',
        targetUserId: 'user-1',
        createdAt: new Date('2026-06-30T08:00:00.000Z'),
        reviewedAt: new Date('2026-06-30T10:00:00.000Z')
      },
      {
        status: 'REJECTED',
        targetUserId: 'user-3',
        createdAt: new Date('2026-06-30T09:00:00.000Z'),
        reviewedAt: new Date('2026-06-30T10:00:00.000Z')
      }
    ]
  })

  assert.deepEqual(metrics, {
    total: 4,
    pending: 2,
    approved: 1,
    rejected: 1,
    overduePending: 1,
    averageReviewMinutes: 90,
    maxReviewMinutes: 120,
    recurringTargetUserIds: [
      {
        targetUserId: 'user-1',
        count: 2
      }
    ]
  })
})
