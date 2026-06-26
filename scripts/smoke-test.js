const DEFAULT_BASE_URL = 'http://localhost:3000'

const baseUrl = (process.env.SMOKE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')

const isLocalSmokeTarget = url => ['localhost', '127.0.0.1', '::1'].includes(url.hostname)

const validateBaseUrl = () => {
  let parsedUrl

  try {
    parsedUrl = new URL(baseUrl)
  } catch {
    fail(`SMOKE_BASE_URL is not a valid URL: ${baseUrl}`)
    return
  }

  if (parsedUrl.protocol !== 'https:' && !isLocalSmokeTarget(parsedUrl)) {
    fail('SMOKE_BASE_URL must use https:// for non-local smoke targets')
  }
}

const requestIdHeader = [
  {
    name: 'x-request-id',
    present: true
  }
]

const checks = [
  {
    name: 'home page',
    path: '/',
    status: 200,
    includes: ['C.M.B.C', 'Classical Music Backing-Track Catalogue'],
    headers: [
      {
        name: 'content-security-policy',
        includes: ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'"]
      },
      {
        name: 'referrer-policy',
        includes: ['strict-origin-when-cross-origin']
      },
      {
        name: 'x-content-type-options',
        includes: ['nosniff']
      },
      {
        name: 'x-frame-options',
        includes: ['DENY']
      },
      {
        name: 'permissions-policy',
        includes: ['camera=()', 'microphone=()', 'geolocation=()']
      }
    ]
  },
  {
    name: 'catalogue page',
    path: '/catalogue',
    status: 200,
    includes: ['Track Listing']
  },
  {
    name: 'public sign-in page',
    path: '/api/auth/signin',
    status: 200,
    includes: ['Sign in with Google'],
    excludes: ['GitHub']
  },
  {
    name: 'profile requires sign-in',
    path: '/profile',
    status: 200,
    includes: ['Sign in with Google'],
    excludes: ['This page could not be found']
  },
  {
    name: 'upload signing requires authentication',
    path: '/api/uploads/signed-url',
    method: 'POST',
    json: {
      fileName: 'smoke-test.mp3',
      contentType: 'audio/mpeg'
    },
    status: 401,
    includes: ['Authentication required'],
    headers: requestIdHeader
  },
  {
    name: 'track creation requires authentication',
    path: '/api/tracks',
    method: 'POST',
    json: {
      title: 'Anonymous Smoke Upload Attempt',
      composer: 'Smoke Test',
      key: 'C major',
      instrumentation: 'Piano',
      newFileName: 'anonymous-smoke-upload.mp3',
      previewStart: 0,
      previewEnd: 30,
      additionalInfo: 'Anonymous users should not be able to create tracks.',
      price: 1,
      downloadCount: 0
    },
    status: 401,
    includes: ['Authentication required'],
    headers: requestIdHeader
  },
  {
    name: 'checkout requires authentication',
    path: '/api/stripe/checkout_sessions',
    method: 'POST',
    json: {
      trackIds: [1]
    },
    status: 401,
    includes: ['Authentication required'],
    headers: requestIdHeader
  },
  {
    name: 'checkout reconciliation requires authentication',
    path: '/api/stripe/checkout_sessions/reconcile',
    method: 'POST',
    json: {
      checkoutSessionId: 'cs_test_smoke'
    },
    status: 401,
    includes: ['Authentication required'],
    headers: requestIdHeader
  },
  {
    name: 'full track URL requires authentication',
    path: '/api/tracks/1/signed-url?mode=full',
    status: 401,
    includes: ['Authentication required'],
    headers: requestIdHeader
  },
  {
    name: 'admin summary requires authentication',
    path: '/api/admin/summary',
    status: 401,
    includes: ['Authentication required'],
    headers: requestIdHeader
  },
  {
    name: 'admin track queue requires authentication',
    path: '/api/admin/tracks',
    status: 401,
    includes: ['Authentication required'],
    headers: requestIdHeader
  },
  {
    name: 'admin users requires authentication',
    path: '/api/admin/users',
    status: 401,
    includes: ['Authentication required'],
    headers: requestIdHeader
  },
  {
    name: 'admin operations requires authentication',
    path: '/api/admin/operations',
    status: 401,
    includes: ['Authentication required'],
    headers: requestIdHeader
  },
  {
    name: 'profile ownership data requires authentication',
    path: '/api/profile',
    status: 401,
    includes: ['Authentication required'],
    headers: requestIdHeader
  },
  {
    name: 'profile comments require authentication',
    path: '/api/profile',
    method: 'POST',
    json: {
      trackId: 1,
      comment: 'Anonymous smoke comment attempt'
    },
    status: 401,
    includes: ['Authentication required'],
    headers: requestIdHeader
  },
  {
    name: 'cart ownership data requires authentication',
    path: '/api/cart',
    status: 401,
    includes: ['Authentication required'],
    headers: requestIdHeader
  },
  {
    name: 'simulated cart fulfilment requires authentication',
    path: '/api/cart',
    method: 'POST',
    json: {
      tracks: [{ id: 1 }]
    },
    status: 401,
    includes: ['Authentication required'],
    headers: requestIdHeader
  }
]

if (process.env.CMC_ENABLE_SYNTHETIC_FIXTURES === 'true') {
  checks.push({
    name: 'synthetic demo fixture stream',
    path: '/api/demo-fixtures/bach-style-warmup.wav',
    status: 200,
    contentType: 'audio/wav'
  })
}

const fail = message => {
  console.error(`Smoke test failed: ${message}`)
  process.exitCode = 1
}

const fetchCheck = async check => {
  const headers = {
    accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8'
  }

  if (check.json) {
    headers['content-type'] = 'application/json'
  }

  const url = `${baseUrl}${check.path}`
  const response = await fetch(url, {
    method: check.method || 'GET',
    headers,
    body: check.json ? JSON.stringify(check.json) : undefined
  })
  const body = check.contentType ? null : await response.text()

  return { url, response, body }
}

const run = async () => {
  console.log(`Running smoke tests against ${baseUrl}`)
  validateBaseUrl()

  if (process.exitCode) {
    process.exit()
  }

  for (const check of checks) {
    const { url, response, body } = await fetchCheck(check)

    if (response.status !== check.status) {
      fail(`${check.name || url} returned ${response.status}; expected ${check.status}`)
      continue
    }

    if (check.contentType) {
      const contentType = response.headers.get('content-type') || ''

      if (!contentType.includes(check.contentType)) {
        fail(`${check.name || url} returned content-type ${contentType}; expected ${check.contentType}`)
      }

      continue
    }

    for (const expectedText of check.includes || []) {
      if (!body.includes(expectedText)) {
        fail(`${check.name || url} did not include expected text: ${expectedText}`)
      }
    }

    for (const forbiddenText of check.excludes || []) {
      if (body.includes(forbiddenText)) {
        fail(`${check.name || url} included forbidden text: ${forbiddenText}`)
      }
    }

    for (const expectedHeader of check.headers || []) {
      const headerValue = response.headers.get(expectedHeader.name) || ''

      if (expectedHeader.present && !headerValue) {
        fail(`${check.name || url} header ${expectedHeader.name} was missing`)
      }

      for (const expectedHeaderText of expectedHeader.includes || []) {
        if (!headerValue.includes(expectedHeaderText)) {
          fail(`${check.name || url} header ${expectedHeader.name} did not include: ${expectedHeaderText}`)
        }
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
