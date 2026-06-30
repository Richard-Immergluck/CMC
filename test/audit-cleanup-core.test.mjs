import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildAuditCleanupPlan,
  cleanupConfirmationPhrase,
  getAuditCleanupBlockers,
  isProductionLikeDatabaseUrl,
  parseAuditCleanupRetentionDays,
  productionDatabaseRef
} from '../lib/server/audit-cleanup-core.mjs'

test('audit cleanup retention days are bounded', () => {
  assert.equal(parseAuditCleanupRetentionDays(undefined), 365)
  assert.equal(parseAuditCleanupRetentionDays('90'), 90)
  assert.throws(() => parseAuditCleanupRetentionDays('29'), /between 30 and 3650/)
  assert.throws(() => parseAuditCleanupRetentionDays('3651'), /between 30 and 3650/)
})

test('audit cleanup blocks production-like environments', () => {
  assert.deepEqual(
    getAuditCleanupBlockers({
      databaseUrl: `postgresql://postgres.${productionDatabaseRef}:secret@example.com/postgres`,
      nodeEnv: 'production',
      vercelEnv: 'production'
    }),
    [
      'VERCEL_ENV=production',
      'NODE_ENV=production',
      'DATABASE_URL appears production-like'
    ]
  )
  assert.equal(isProductionLikeDatabaseUrl('postgresql://example-production/postgres'), true)
  assert.equal(isProductionLikeDatabaseUrl('postgresql://dev.example.com/postgres'), false)
})

test('audit cleanup plan defaults to dry-run and requires execute confirmation', () => {
  const dryRunPlan = buildAuditCleanupPlan({
    databaseUrl: 'postgresql://dev.example.com/postgres',
    execute: false,
    retentionDays: 365,
    now: new Date('2026-06-30T12:00:00.000Z')
  })

  assert.equal(dryRunPlan.allowed, true)
  assert.equal(dryRunPlan.mode, 'dry-run')
  assert.equal(dryRunPlan.cutoff.toISOString(), '2025-06-30T12:00:00.000Z')

  assert.deepEqual(
    buildAuditCleanupPlan({
      databaseUrl: 'postgresql://dev.example.com/postgres',
      execute: true,
      retentionDays: 365
    }).blockers,
    [`AUDIT_CLEANUP_CONFIRM must equal ${cleanupConfirmationPhrase}`]
  )
  assert.equal(
    buildAuditCleanupPlan({
      confirmation: cleanupConfirmationPhrase,
      databaseUrl: 'postgresql://dev.example.com/postgres',
      execute: true,
      retentionDays: 365
    }).allowed,
    true
  )
})
