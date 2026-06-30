export const productionDatabaseRef = 'qliszqosnphiuwhyzgsj'
export const cleanupConfirmationPhrase = 'delete-dev-audit-events'

export const parseAuditCleanupRetentionDays = value => {
  const parsed = Number(value || 365)

  if (!Number.isInteger(parsed) || parsed < 30 || parsed > 3650) {
    throw new Error('AUDIT_CLEANUP_RETENTION_DAYS must be an integer between 30 and 3650')
  }

  return parsed
}

export const isProductionLikeDatabaseUrl = databaseUrl => {
  const normalized = String(databaseUrl || '').toLowerCase()

  return normalized.includes(productionDatabaseRef) ||
    normalized.includes('production') ||
    normalized.includes('prod')
}

export const getAuditCleanupBlockers = ({
  databaseUrl,
  nodeEnv,
  vercelEnv
}) => {
  const blockers = []

  if (vercelEnv === 'production') {
    blockers.push('VERCEL_ENV=production')
  }

  if (nodeEnv === 'production') {
    blockers.push('NODE_ENV=production')
  }

  if (isProductionLikeDatabaseUrl(databaseUrl)) {
    blockers.push('DATABASE_URL appears production-like')
  }

  return blockers
}

export const buildAuditCleanupPlan = ({
  confirmation,
  databaseUrl,
  execute,
  nodeEnv,
  now = new Date(),
  retentionDays,
  vercelEnv
}) => {
  const blockers = getAuditCleanupBlockers({
    databaseUrl,
    nodeEnv,
    vercelEnv
  })
  const cutoff = new Date(new Date(now).getTime() - retentionDays * 24 * 60 * 60 * 1000)
  const mode = execute ? 'execute' : 'dry-run'

  if (execute && confirmation !== cleanupConfirmationPhrase) {
    blockers.push(`AUDIT_CLEANUP_CONFIRM must equal ${cleanupConfirmationPhrase}`)
  }

  return {
    allowed: blockers.length === 0,
    blockers,
    cutoff,
    mode,
    retentionDays
  }
}
