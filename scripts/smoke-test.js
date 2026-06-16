const DEFAULT_BASE_URL = 'http://localhost:3000'

const baseUrl = (process.env.SMOKE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')

const checks = [
  {
    path: '/',
    status: 200,
    includes: ['C.M.B.C', 'Classical Music Backing-Track Catalogue']
  },
  {
    path: '/catalogue',
    status: 200,
    includes: ['Track Listing']
  },
  {
    path: '/api/auth/signin',
    status: 200,
    includes: ['Sign in with Google'],
    excludes: ['GitHub']
  }
]

const fail = message => {
  console.error(`Smoke test failed: ${message}`)
  process.exitCode = 1
}

const fetchText = async path => {
  const url = `${baseUrl}${path}`
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8'
    }
  })
  const body = await response.text()

  return { url, response, body }
}

const run = async () => {
  console.log(`Running smoke tests against ${baseUrl}`)

  for (const check of checks) {
    const { url, response, body } = await fetchText(check.path)

    if (response.status !== check.status) {
      fail(`${url} returned ${response.status}; expected ${check.status}`)
      continue
    }

    for (const expectedText of check.includes || []) {
      if (!body.includes(expectedText)) {
        fail(`${url} did not include expected text: ${expectedText}`)
      }
    }

    for (const forbiddenText of check.excludes || []) {
      if (body.includes(forbiddenText)) {
        fail(`${url} included forbidden text: ${forbiddenText}`)
      }
    }
  }

  if (process.exitCode) {
    process.exit()
  }

  console.log('Smoke tests passed')
}

run().catch(error => {
  fail(error.message)
  process.exit()
})
