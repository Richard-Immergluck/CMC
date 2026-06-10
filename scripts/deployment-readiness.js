const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

const requiredProductionEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GITHUB_ID',
  'GITHUB_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'S3_ACCESS_ID',
  'S3_APP_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'S3_REGION',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'ALLOW_SIMULATED_PURCHASES'
]

const fail = message => {
  console.error(`Deployment readiness failed: ${message}`)
  process.exitCode = 1
}

const warn = message => {
  console.warn(`Deployment readiness warning: ${message}`)
}

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'))

const packageJson = readJson(path.join(root, 'package.json'))
const requiredFiles = ['prisma.config.ts', 'prisma/schema.prisma']

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    fail(`Missing required file: ${file}`)
  }
}

if (packageJson.engines?.node !== '24.x') {
  fail('package.json must pin engines.node to "24.x" for the current LTS runtime')
}

for (const scriptName of ['sanity', 'deps:audit', 'deploy:check']) {
  if (!packageJson.scripts?.[scriptName]) {
    fail(`package.json is missing the "${scriptName}" script`)
  }
}

const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8')

for (const envVar of requiredProductionEnvVars) {
  if (!envExample.includes(envVar)) {
    fail(`.env.example is missing ${envVar}`)
  }
}

const requiredMigrationDirs = [
  '20260603234500_track_owner_unique_constraint',
  '20260604002000_add_orders_and_payment_events',
  '20260604004000_harden_track_money_and_status'
]

for (const migrationDir of requiredMigrationDirs) {
  const migrationPath = path.join(root, 'prisma', 'migrations', migrationDir, 'migration.sql')
  if (!fs.existsSync(migrationPath)) {
    fail(`Missing required Prisma migration: ${migrationDir}`)
  }
}

const optionalPlatformChecks = [
  {
    name: 'VERCEL_PROJECT_ROOT',
    expected: '.',
    description: 'Vercel Project Settings > General > Root Directory'
  },
  {
    name: 'VERCEL_NODE_VERSION',
    expected: '24.x',
    description: 'Vercel Node.js setting, or the effective value from package.json engines'
  },
  {
    name: 'SUPABASE_PROJECT_STATUS',
    expected: 'ACTIVE',
    description: 'Supabase project status before migration verification'
  }
]

for (const { name, expected, description } of optionalPlatformChecks) {
  const actual = process.env[name]

  if (!actual) {
    warn(`${name} not provided; expected ${expected} (${description})`)
    continue
  }

  if (actual !== expected) {
    fail(`${name} is "${actual}", expected "${expected}" (${description})`)
  }
}

if (process.exitCode) {
  process.exit()
}

console.log('Deployment readiness checks passed')
