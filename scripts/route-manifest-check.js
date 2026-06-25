const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const manifestPath = path.join(root, '.next', 'server', 'pages-manifest.json')

const requiredRoutes = [
  '/',
  '/admin',
  '/cart',
  '/catalogue',
  '/catalogue/[trackId]',
  '/profile',
  '/profile/[trackId]',
  '/upload',
  '/api/admin/summary',
  '/api/admin/tracks',
  '/api/admin/tracks/[trackId]',
  '/api/admin/users',
  '/api/admin/users/[userId]',
  '/api/stripe/checkout_sessions',
  '/api/stripe/checkout_sessions/reconcile',
  '/api/stripe/webhook',
  '/api/tracks',
  '/api/tracks/[trackId]/signed-url',
  '/api/uploads/signed-url'
]

const fail = message => {
  console.error(`Route manifest check failed: ${message}`)
  process.exitCode = 1
}

if (!fs.existsSync(manifestPath)) {
  fail('missing .next/server/pages-manifest.json; run next build first')
  process.exit()
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

for (const route of requiredRoutes) {
  if (!manifest[route]) {
    fail(`missing built route ${route}`)
  }
}

if (process.exitCode) {
  process.exit()
}

console.log('Route manifest checks passed')
