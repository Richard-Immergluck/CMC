import pg from 'pg'

const { Client } = pg

const requiredTables = [
  'Account',
  'Session',
  'User',
  'VerificationToken',
  'Track',
  'TrackOwner',
  'Comment',
  'Order',
  'OrderItem',
  'PaymentEvent',
  'AuditEvent',
  '_prisma_migrations'
]

const forbiddenRoles = ['anon', 'authenticated']
const forbiddenPrivileges = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for RLS/grant checks')
}

const client = new Client({
  connectionString: process.env.DATABASE_URL
})

const quoteLiteralList = values => values.map(value => `'${value.replace(/'/g, "''")}'`).join(', ')

try {
  await client.connect()

  const rlsResult = await client.query(`
    SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname IN (${quoteLiteralList(requiredTables)})
    ORDER BY c.relname
  `)

  const foundTables = new Set(rlsResult.rows.map(row => row.table_name))
  const missingTables = requiredTables.filter(tableName => !foundTables.has(tableName))
  const rlsDisabledTables = rlsResult.rows
    .filter(row => !row.rls_enabled)
    .map(row => row.table_name)

  const grantResult = await client.query(`
    SELECT grantee, table_name, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name IN (${quoteLiteralList(requiredTables)})
      AND grantee IN (${quoteLiteralList(forbiddenRoles)})
      AND privilege_type IN (${quoteLiteralList(forbiddenPrivileges)})
    ORDER BY grantee, table_name, privilege_type
  `)

  if (missingTables.length || rlsDisabledTables.length || grantResult.rows.length) {
    console.error('RLS/grant posture check failed')

    if (missingTables.length) {
      console.error(`Missing expected tables: ${missingTables.join(', ')}`)
    }

    if (rlsDisabledTables.length) {
      console.error(`Tables without RLS enabled: ${rlsDisabledTables.join(', ')}`)
    }

    if (grantResult.rows.length) {
      console.error('Forbidden direct grants:')
      console.error(JSON.stringify(grantResult.rows, null, 2))
    }

    process.exit(1)
  }

  console.log(`RLS/grant posture checks passed for ${requiredTables.length} tables`)
} finally {
  await client.end()
}

