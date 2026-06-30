import {
  toAuditEventQueryOptions,
  toAuditEventAdminItem,
  toOrderAdminItem,
  toPaymentEventAdminItem,
  toUserAccessChangeRequestAdminItem
} from './admin-core.mjs'
import {
  parseReviewMetricsWindowDays,
  parseReviewOverdueHours,
  summarizeAccessReviewMetrics
} from './admin-access-review-metrics-core.mjs'
import prisma from './prisma'
import {
  buildSecurityDashboardSummary,
  securityDashboardAuditActions,
  toAuditActionCounts
} from './security-dashboard-core.mjs'

export const getSecurityDashboardData = async () => {
  const windowDays = parseReviewMetricsWindowDays(process.env.ADMIN_ACCESS_REVIEW_METRICS_WINDOW_DAYS)
  const overdueHours = parseReviewOverdueHours(process.env.ADMIN_ACCESS_REVIEW_OVERDUE_HOURS)
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)

  const [groupedAuditEvents, accessReviewRequests, recentAuditEvents] = await Promise.all([
    prisma.auditEvent.groupBy({
      by: ['action'],
      where: {
        action: {
          in: securityDashboardAuditActions
        },
        createdAt: {
          gte: since
        }
      },
      _count: {
        _all: true
      }
    }),
    prisma.userAccessChangeRequest.findMany({
      where: {
        createdAt: {
          gte: since
        }
      },
      select: {
        status: true,
        targetUserId: true,
        createdAt: true,
        reviewedAt: true
      }
    }),
    prisma.auditEvent.findMany({
      where: {
        action: {
          in: securityDashboardAuditActions
        },
        createdAt: {
          gte: since
        }
      },
      include: {
        actor: true
      },
      orderBy: [
        {
          createdAt: 'desc'
        }
      ],
      take: 10
    })
  ])

  return buildSecurityDashboardSummary({
    auditActionCounts: toAuditActionCounts(groupedAuditEvents),
    accessReviewMetrics: summarizeAccessReviewMetrics({
      requests: accessReviewRequests,
      overdueHours
    }),
    windowDays,
    overdueHours,
    recentAuditEvents: recentAuditEvents.map(toAuditEventAdminItem)
  })
}

export const getAdminOperationsData = async ({ audit = {} } = {}) => {
  const auditQueryOptions = toAuditEventQueryOptions(audit)

  const [orders, paymentEvents, auditEvents, accessChangeRequests, securityDashboard] = await Promise.all([
    prisma.order.findMany({
      include: {
        user: true,
        items: true
      },
      orderBy: [
        {
          createdAt: 'desc'
        }
      ],
      take: 25
    }),
    prisma.paymentEvent.findMany({
      orderBy: [
        {
          processedAt: 'desc'
        }
      ],
      take: 25
    }),
    prisma.auditEvent.findMany({
      where: auditQueryOptions.where,
      include: {
        actor: true
      },
      orderBy: auditQueryOptions.orderBy,
      take: auditQueryOptions.take
    }),
    prisma.userAccessChangeRequest.findMany({
      include: {
        targetUser: true,
        requestedBy: true,
        reviewedBy: true
      },
      orderBy: [
        {
          createdAt: 'desc'
        }
      ],
      take: 25
    }),
    getSecurityDashboardData()
  ])

  return {
    orders: orders.map(toOrderAdminItem),
    paymentEvents: paymentEvents.map(toPaymentEventAdminItem),
    auditEvents: auditEvents.map(toAuditEventAdminItem),
    accessChangeRequests: accessChangeRequests.map(toUserAccessChangeRequestAdminItem),
    securityDashboard
  }
}
