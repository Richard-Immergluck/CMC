const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

const sensitiveMutationRoutes = [
  {
    file: 'app/api/admin/users/[userId]/route.js',
    method: 'PATCH'
  },
  {
    file: 'app/api/admin/user-access-requests/[requestId]/route.js',
    method: 'PATCH'
  },
  {
    file: 'app/api/admin/tracks/[trackId]/route.js',
    method: 'PATCH'
  },
  {
    file: 'app/api/admin/tracks/bulk-moderation/route.js',
    method: 'PATCH'
  }
]

const fail = message => {
  console.error(`Sensitive route policy check failed: ${message}`)
  process.exitCode = 1
}

for (const route of sensitiveMutationRoutes) {
  const filePath = path.join(root, route.file)

  if (!fs.existsSync(filePath)) {
    fail(`Missing sensitive route file: ${route.file}`)
    continue
  }

  const contents = fs.readFileSync(filePath, 'utf8')

  if (!contents.includes(`export async function ${route.method}`)) {
    fail(`${route.file} must expose ${route.method}`)
  }

  if (!contents.includes('requireSensitiveRouteCurrentUser')) {
    fail(`${route.file} must require the sensitive route session guard`)
  }

  if (/\brequireRouteCurrentUser\b/.test(contents.replaceAll('requireSensitiveRouteCurrentUser', ''))) {
    fail(`${route.file} must not use the standard route session guard`)
  }
}

if (process.exitCode) {
  process.exit()
}

console.log('Sensitive route policy checks passed')
