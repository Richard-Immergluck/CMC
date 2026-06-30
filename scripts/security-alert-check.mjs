import prisma from '../lib/server/prisma.js'
import {
  defaultSecurityAlertRules,
  evaluateSecurityAlertCounts,
  hasHighSeverityFindings
} from '../lib/server/security-alerts-core.mjs'

const parseWindowMinutes = value => {
  const parsed = Number(value || 15)

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 1440) {
    throw new Error('SECURITY_ALERT_WINDOW_MINUTES must be an integer between 1 and 1440')
  }

  return parsed
}

const windowMinutes = parseWindowMinutes(process.env.SECURITY_ALERT_WINDOW_MINUTES)
const since = new Date(Date.now() - windowMinutes * 60 * 1000)

try {
  const groupedEvents = await prisma.auditEvent.groupBy({
    by: ['action'],
    where: {
      createdAt: {
        gte: since
      }
    },
    _count: {
      _all: true
    }
  })
  const counts = Object.fromEntries(
    groupedEvents.map(row => [row.action, row._count._all])
  )
  const findings = evaluateSecurityAlertCounts({
    counts,
    rules: defaultSecurityAlertRules
  })
  const report = {
    windowMinutes,
    since: since.toISOString(),
    counts,
    findings
  }

  console.log(JSON.stringify(report, null, 2))

  if (hasHighSeverityFindings(findings)) {
    process.exitCode = 1
  }
} finally {
  await prisma.$disconnect()
}
