const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

const listFiles = directory => {
  const absoluteDirectory = path.join(root, directory)

  if (!fs.existsSync(absoluteDirectory)) {
    return []
  }

  return fs.readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap(entry => {
    const relativePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return listFiles(relativePath)
    }

    return [relativePath]
  })
}

const requiredFiles = [
  '.env.example',
  'RELEASE_GATES.md',
  'UI_DEVELOPMENT.md',
  'components/ui/README.md',
  'components/ui/primitives/Button.js',
  'components/ui/primitives/Panel.js',
  'components/ui/primitives/Stack.js',
  'components/ui/primitives/index.js',
  'lib/access-control.mjs',
  'lib/design/theme.js',
  'lib/design/tokens.js',
  'lib/server/admin-core.mjs',
  'lib/server/admin-operations.js',
  'lib/server/api-core.mjs',
  'lib/server/audit-core.mjs',
  'lib/server/orders.js',
  'lib/server/permissions.mjs',
  'lib/server/s3.js',
  'lib/server/stripe.js',
  'lib/server/tracks-core.mjs',
  'lib/server/demo-fixtures.js',
  'lib/server/url.js',
  'lib/validation/api.mjs',
  'app/api/demo-fixtures/[fixtureName]/route.js',
  'app/api/admin/operations/route.js',
  'app/api/admin/security-report/route.js',
  'app/api/admin/user-access-requests/[requestId]/route.js',
  'app/api/tracks/[trackId]/signed-url/route.js',
  'app/api/uploads/signed-url/route.js',
  'app/api/stripe/checkout_sessions/route.js',
  'app/api/stripe/webhook/route.js',
  'prisma/schema.prisma',
  'scripts/deployment-readiness.js',
  'scripts/health-smoke-test.js',
  'scripts/route-manifest-check.js',
  'scripts/smoke-test.js',
  'styles/tokens.css'
]

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'S3_ACCESS_ID',
  'S3_APP_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'S3_REGION',
  'S3_KEY_PREFIX',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'ALLOW_SIMULATED_PURCHASES'
]

const optionalDocumentedEnvVars = [
  'EMAIL_SERVER',
  'EMAIL_FROM',
  'ADMIN_ACCESS_REVIEW_EMAIL_RECIPIENTS',
  'CMC_ENABLE_SYNTHETIC_FIXTURES',
  'DEMO_SEED_USER_EMAIL',
  'DEMO_SEED_USER_NAME',
  'SECURITY_ALERT_WINDOW_MINUTES',
  'ADMIN_ACCESS_REVIEW_METRICS_WINDOW_DAYS',
  'ADMIN_ACCESS_REVIEW_OVERDUE_HOURS',
  'AUDIT_CLEANUP_RETENTION_DAYS',
  'AUDIT_CLEANUP_EXECUTE',
  'AUDIT_CLEANUP_CONFIRM'
]

const fail = message => {
  console.error(message)
  process.exitCode = 1
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    fail(`Missing required file: ${file}`)
  }
}

const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8')

for (const envVar of requiredEnvVars) {
  if (!envExample.includes(envVar)) {
    fail(`Missing ${envVar} from .env.example`)
  }
}

for (const envVar of optionalDocumentedEnvVars) {
  if (!envExample.includes(envVar)) {
    fail(`Missing optional documented env var ${envVar} from .env.example`)
  }
}

const componentFiles = listFiles('components').filter(file => /\.(js|jsx|ts|tsx)$/.test(file))
const pageFiles = listFiles('pages')
  .filter(file => !file.startsWith(path.join('pages', 'api')))
  .filter(file => /\.(js|jsx|ts|tsx)$/.test(file))

const forbiddenBrowserPatterns = [
  'process.env.',
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_SECRET',
  'EMAIL_SERVER',
  'S3_ACCESS_ID',
  'S3_APP_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'aws-sdk',
  "from 'stripe'",
  'from "stripe"'
]

const forbiddenComponentPatterns = [
  ...forbiddenBrowserPatterns,
  "from '../lib/server",
  'from "../lib/server',
  "from '../../lib/server",
  'from "../../lib/server'
]

for (const file of componentFiles) {
  const contents = fs.readFileSync(path.join(root, file), 'utf8')

  for (const pattern of forbiddenComponentPatterns) {
    if (contents.includes(pattern)) {
      fail(`Forbidden component pattern "${pattern}" found in ${file}`)
    }
  }
}

for (const file of pageFiles) {
  const contents = fs.readFileSync(path.join(root, file), 'utf8')

  for (const pattern of forbiddenBrowserPatterns) {
    if (contents.includes(pattern)) {
      fail(`Forbidden page pattern "${pattern}" found in ${file}`)
    }
  }
}

const forbiddenConfigPatterns = ['S3_APP_ACCESS_KEY', 'STRIPE_SECRET_KEY', 'DATABASE_URL']
const nextConfig = fs.readFileSync(path.join(root, 'next.config.js'), 'utf8')

for (const pattern of forbiddenConfigPatterns) {
  if (nextConfig.includes(pattern)) {
    fail(`Forbidden config pattern "${pattern}" found in next.config.js`)
  }
}

if (process.exitCode) {
  process.exit()
}

console.log('Sanity checks passed')
