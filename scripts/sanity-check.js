const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

const requiredFiles = [
  '.env.example',
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
  'pages/api/admin/operations.js',
  'pages/api/demo-fixtures/[fixtureName].js',
  'pages/api/stripe/checkout_sessions.js',
  'pages/api/stripe/webhook.js',
  'pages/api/tracks/[trackId]/signed-url.js',
  'pages/api/uploads/signed-url.js',
  'prisma/schema.prisma',
  'scripts/deployment-readiness.js',
  'scripts/route-manifest-check.js',
  'scripts/smoke-test.js'
]

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'S3_ACCESS_ID',
  'S3_APP_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'S3_REGION',
  'S3_KEY_PREFIX',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
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

const forbiddenClientPatterns = [
  {
    file: 'components/uploadFormComponents/UploadForm.js',
    pattern: 'aws-sdk'
  },
  {
    file: 'next.config.js',
    pattern: 'S3_APP_ACCESS_KEY'
  },
  {
    file: 'next.config.js',
    pattern: 'STRIPE_SECRET_KEY'
  }
]

for (const { file, pattern } of forbiddenClientPatterns) {
  const contents = fs.readFileSync(path.join(root, file), 'utf8')

  if (contents.includes(pattern)) {
    fail(`Forbidden client/config pattern "${pattern}" found in ${file}`)
  }
}

if (process.exitCode) {
  process.exit()
}

console.log('Sanity checks passed')
