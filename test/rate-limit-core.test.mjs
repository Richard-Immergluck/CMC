import assert from 'node:assert/strict'
import test from 'node:test'
import {
  checkSharedRateLimit,
  checkRateLimit,
  createRateLimitHeaders,
  createRateLimitKey,
  getRateLimitClientIp,
  isSharedRateLimitConfigured
} from '../lib/server/rate-limit-core.mjs'
import {
  createTooManyRequestsError,
  toErrorResponse
} from '../lib/server/api-core.mjs'

const createRequest = headers => ({
  headers: {
    get: name => headers[name] || null
  }
})

test('rate limit keys prefer user ids over client ips', () => {
  assert.equal(
    createRateLimitKey({
      scope: 'checkout',
      userId: 'user-123',
      request: createRequest({
        'x-forwarded-for': '203.0.113.10'
      })
    }),
    'checkout:user-123'
  )
})

test('client ip is extracted from forwarded headers', () => {
  assert.equal(
    getRateLimitClientIp(createRequest({
      'x-forwarded-for': '203.0.113.10, 198.51.100.2'
    })),
    '203.0.113.10'
  )

  assert.equal(
    getRateLimitClientIp(createRequest({
      'x-real-ip': '198.51.100.20'
    })),
    '198.51.100.20'
  )
})

test('checkRateLimit allows requests up to the limit within a window', () => {
  const store = new Map()
  const now = () => 1000

  assert.deepEqual(
    checkRateLimit({
      store,
      key: 'upload:user-123',
      limit: 2,
      windowMs: 10000,
      now
    }),
    {
      allowed: true,
      limit: 2,
      remaining: 1,
      resetAt: 11000,
      retryAfterSeconds: 0
    }
  )

  assert.equal(
    checkRateLimit({
      store,
      key: 'upload:user-123',
      limit: 2,
      windowMs: 10000,
      now
    }).allowed,
    true
  )

  assert.deepEqual(
    checkRateLimit({
      store,
      key: 'upload:user-123',
      limit: 2,
      windowMs: 10000,
      now
    }),
    {
      allowed: false,
      limit: 2,
      remaining: 0,
      resetAt: 11000,
      retryAfterSeconds: 10
    }
  )
})

test('checkRateLimit resets after the window expires', () => {
  const store = new Map()
  let timestamp = 1000
  const now = () => timestamp

  checkRateLimit({
    store,
    key: 'comments:203.0.113.10',
    limit: 1,
    windowMs: 10000,
    now
  })

  timestamp = 11000

  assert.deepEqual(
    checkRateLimit({
      store,
      key: 'comments:203.0.113.10',
      limit: 1,
      windowMs: 10000,
      now
    }),
    {
      allowed: true,
      limit: 1,
      remaining: 0,
      resetAt: 21000,
      retryAfterSeconds: 0
    }
  )
})

test('shared rate limit uses Upstash REST pipeline commands', async () => {
  let capturedRequest
  const result = await checkSharedRateLimit({
    key: 'checkout:user-123',
    limit: 2,
    windowMs: 10000,
    now: () => 1000,
    url: 'https://redis.example.com/',
    token: 'test-token',
    fetchImpl: async (url, init) => {
      capturedRequest = {
        url,
        init
      }

      return {
        ok: true,
        json: async () => [
          { result: 1 },
          { result: 1 },
          { result: 10000 }
        ]
      }
    }
  })

  assert.deepEqual(result, {
    allowed: true,
    limit: 2,
    remaining: 1,
    resetAt: 11000,
    retryAfterSeconds: 0
  })
  assert.equal(capturedRequest.url, 'https://redis.example.com/pipeline')
  assert.equal(capturedRequest.init.method, 'POST')
  assert.equal(capturedRequest.init.headers.Authorization, 'Bearer test-token')
  assert.deepEqual(JSON.parse(capturedRequest.init.body), [
    ['INCR', 'cmc:rate-limit:checkout:user-123'],
    ['EXPIRE', 'cmc:rate-limit:checkout:user-123', 10, 'NX'],
    ['PTTL', 'cmc:rate-limit:checkout:user-123']
  ])
})

test('shared rate limit denies when the shared count exceeds the limit', async () => {
  const result = await checkSharedRateLimit({
    key: 'checkout:user-123',
    limit: 2,
    windowMs: 10000,
    now: () => 1000,
    url: 'https://redis.example.com',
    token: 'test-token',
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        result: [
          { result: 3 },
          { result: 0 },
          { result: 4000 }
        ]
      })
    })
  })

  assert.deepEqual(result, {
    allowed: false,
    limit: 2,
    remaining: 0,
    resetAt: 5000,
    retryAfterSeconds: 4
  })
})

test('shared rate limit requires both Upstash environment values', async () => {
  assert.equal(isSharedRateLimitConfigured({
    url: 'https://redis.example.com',
    token: 'test-token'
  }), true)
  assert.equal(isSharedRateLimitConfigured({
    url: 'https://redis.example.com',
    token: ''
  }), false)

  await assert.rejects(
    () => checkSharedRateLimit({
      key: 'checkout:user-123',
      limit: 2,
      windowMs: 10000,
      url: '',
      token: ''
    }),
    /Shared rate-limit store is not configured/
  )
})

test('rate limit headers and API error serialize safely', () => {
  assert.deepEqual(
    createRateLimitHeaders({
      limit: 2,
      remaining: 0,
      resetAt: 11000,
      retryAfterSeconds: 10
    }),
    {
      'X-RateLimit-Limit': '2',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': '11',
      'Retry-After': '10'
    }
  )

  assert.deepEqual(
    toErrorResponse(createTooManyRequestsError({ retryAfterSeconds: 10 })),
    {
      statusCode: 429,
      body: {
        message: 'Too many requests'
      }
    }
  )
})
