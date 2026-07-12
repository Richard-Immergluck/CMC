const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const pagesManifestPath = path.join(root, '.next', 'server', 'pages-manifest.json')
const appRoutesManifestPath = path.join(root, '.next', 'app-path-routes-manifest.json')

const requiredRoutes = [
  '/',
  '/admin',
  '/cart',
  '/catalogue',
  '/catalogue/[trackId]',
  '/profile',
  '/upload',
  '/api',
  '/api/admin/health',
  '/api/admin/operations',
  '/api/admin/security-report',
  '/api/admin/summary',
  '/api/admin/tracks',
  '/api/admin/tracks/[trackId]',
  '/api/admin/tracks/bulk-moderation',
  '/api/admin/user-access-requests/[requestId]',
  '/api/admin/users',
  '/api/admin/users/[userId]',
  '/api/auth/[...nextauth]',
  '/api/cart',
  '/api/comments',
  '/api/demo-fixtures/[fixtureName]',
  '/api/e2e/session',
  '/api/health',
  '/api/profile',
  '/api/stripe/checkout_sessions',
  '/api/stripe/checkout_sessions/reconcile',
  '/api/stripe/webhook',
  '/api/tracks',
  '/api/tracks/bulk-metadata',
  '/api/tracks/[trackId]',
  '/api/tracks/[trackId]/signed-url',
  '/api/tracks/list',
  '/api/uploads/signed-url'
]

const fail = message => {
  console.error(`Route manifest check failed: ${message}`)
  process.exitCode = 1
}

if (!fs.existsSync(pagesManifestPath)) {
  fail('missing .next/server/pages-manifest.json; run next build first')
  process.exit()
}

const pagesManifest = JSON.parse(fs.readFileSync(pagesManifestPath, 'utf8'))
const appRoutesManifest = fs.existsSync(appRoutesManifestPath)
  ? JSON.parse(fs.readFileSync(appRoutesManifestPath, 'utf8'))
  : {}
const builtAppRoutes = new Set(Object.values(appRoutesManifest))

for (const route of requiredRoutes) {
  if (!pagesManifest[route] && !builtAppRoutes.has(route)) {
    fail(`missing built route ${route}`)
  }
}

if (process.exitCode) {
  process.exit()
}

console.log('Route manifest checks passed')
