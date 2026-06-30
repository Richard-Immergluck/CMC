import prisma from '../lib/server/prisma.js'
import {
  buildAuditCleanupPlan,
  parseAuditCleanupRetentionDays
} from '../lib/server/audit-cleanup-core.mjs'

const retentionDays = parseAuditCleanupRetentionDays(process.env.AUDIT_CLEANUP_RETENTION_DAYS)
const execute = process.env.AUDIT_CLEANUP_EXECUTE === 'true'
const plan = buildAuditCleanupPlan({
  confirmation: process.env.AUDIT_CLEANUP_CONFIRM,
  databaseUrl: process.env.DATABASE_URL,
  execute,
  nodeEnv: process.env.NODE_ENV,
  retentionDays,
  vercelEnv: process.env.VERCEL_ENV
})

if (!plan.allowed) {
  console.error(JSON.stringify({
    status: 'blocked',
    blockers: plan.blockers,
    mode: plan.mode,
    retentionDays: plan.retentionDays,
    cutoff: plan.cutoff.toISOString()
  }, null, 2))
  process.exit(1)
}

try {
  const where = {
    createdAt: {
      lt: plan.cutoff
    }
  }
  const [candidateCount, groupedCandidates] = await Promise.all([
    prisma.auditEvent.count({
      where
    }),
    prisma.auditEvent.groupBy({
      by: ['action'],
      where,
      _count: {
        _all: true
      },
      orderBy: {
        action: 'asc'
      }
    })
  ])
  const result = {
    status: plan.mode,
    retentionDays: plan.retentionDays,
    cutoff: plan.cutoff.toISOString(),
    candidateCount,
    candidatesByAction: Object.fromEntries(
      groupedCandidates.map(row => [row.action, row._count._all])
    )
  }

  if (execute) {
    const deleted = await prisma.auditEvent.deleteMany({
      where
    })

    result.deletedCount = deleted.count
  }

  console.log(JSON.stringify(result, null, 2))
} finally {
  await prisma.$disconnect()
}
