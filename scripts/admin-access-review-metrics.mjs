import prisma from '../lib/server/prisma.js'
import {
  parseReviewMetricsWindowDays,
  parseReviewOverdueHours,
  summarizeAccessReviewMetrics
} from '../lib/server/admin-access-review-metrics-core.mjs'

const windowDays = parseReviewMetricsWindowDays(process.env.ADMIN_ACCESS_REVIEW_METRICS_WINDOW_DAYS)
const overdueHours = parseReviewOverdueHours(process.env.ADMIN_ACCESS_REVIEW_OVERDUE_HOURS)
const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)

try {
  const requests = await prisma.userAccessChangeRequest.findMany({
    where: {
      createdAt: {
        gte: since
      }
    },
    select: {
      id: true,
      status: true,
      targetUserId: true,
      requestedById: true,
      reviewedById: true,
      requestedRole: true,
      requestedAccountStatus: true,
      requestedUploaderStatus: true,
      createdAt: true,
      reviewedAt: true,
      appliedAt: true
    },
    orderBy: [
      {
        createdAt: 'desc'
      }
    ]
  })
  const metrics = summarizeAccessReviewMetrics({
    requests,
    now: new Date(),
    overdueHours
  })

  console.log(JSON.stringify({
    windowDays,
    overdueHours,
    since: since.toISOString(),
    metrics
  }, null, 2))
} finally {
  await prisma.$disconnect()
}
