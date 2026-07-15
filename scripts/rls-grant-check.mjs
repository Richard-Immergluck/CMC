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
  'TrackRequest',
  'TrackRequestResponse',
  'WishlistItem',
  'CatalogueRelease',
  'CatalogueReleaseTrack',
  'CatalogueTag',
  'CatalogueReleaseTag',
  'RequestPricingProposal',
  'UploadBatch',
  'Order',
  'OrderItem',
  'PaymentEvent',
  'CatalogueRelease',
  'CatalogueReleaseTrack',
  'RequestPricingProposal',
  'UploadBatch',
  'AuditEvent',
  'UserAccessChangeRequest',
  '_prisma_migrations'
]

const forbiddenRoles = ['anon', 'authenticated']
const forbiddenPrivileges = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']
const forbiddenSequencePrivileges = ['USAGE', 'SELECT', 'UPDATE']

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
    ORDER BY c.relname
  `)

  const foundTables = new Set(rlsResult.rows.map(row => row.table_name))
  const missingTables = requiredTables.filter(tableName => !foundTables.has(tableName))
  const unexpectedTables = rlsResult.rows
    .map(row => row.table_name)
    .filter(tableName => !requiredTables.includes(tableName))
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

  const sequenceGrantResult = await client.query(`
    WITH forbidden_roles AS (
      SELECT grantee
      FROM unnest(ARRAY[${quoteLiteralList(forbiddenRoles)}]) AS roles(grantee)
      WHERE to_regrole(grantee) IS NOT NULL
    ),
    forbidden_privileges AS (
      SELECT unnest(ARRAY[${quoteLiteralList(forbiddenSequencePrivileges)}]) AS privilege_type
    ),
    public_sequences AS (
      SELECT c.oid, c.relname AS sequence_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'S'
    )
    SELECT r.grantee, s.sequence_name, p.privilege_type
    FROM public_sequences s
    CROSS JOIN forbidden_roles r
    CROSS JOIN forbidden_privileges p
    WHERE has_sequence_privilege(r.grantee, s.oid, p.privilege_type)
    ORDER BY r.grantee, s.sequence_name, p.privilege_type
  `)

  if (
    missingTables.length ||
    unexpectedTables.length ||
    rlsDisabledTables.length ||
    grantResult.rows.length ||
    sequenceGrantResult.rows.length
  ) {
    console.error('RLS/grant posture check failed')

    if (missingTables.length) {
      console.error(`Missing expected tables: ${missingTables.join(', ')}`)
    }

    if (unexpectedTables.length) {
      console.error(`Unexpected public tables not in posture manifest: ${unexpectedTables.join(', ')}`)
    }

    if (rlsDisabledTables.length) {
      console.error(`Tables without RLS enabled: ${rlsDisabledTables.join(', ')}`)
    }

    if (grantResult.rows.length) {
      console.error('Forbidden direct grants:')
      console.error(JSON.stringify(grantResult.rows, null, 2))
    }

    if (sequenceGrantResult.rows.length) {
      console.error('Forbidden sequence grants:')
      console.error(JSON.stringify(sequenceGrantResult.rows, null, 2))
    }

    process.exit(1)
  }

  console.log(`RLS/grant posture checks passed for ${requiredTables.length} tables and public sequences`)
} finally {
  await client.end()
}
