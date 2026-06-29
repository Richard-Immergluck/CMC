import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ApiError,
  createAuthenticationError,
  createConflictError,
  createForbiddenError,
  createMethodNotAllowedError,
  createTooManyRequestsError,
  createValidationError,
  formatAllowHeader,
  methodAllowed,
  toErrorHeaders,
  toErrorResponse
} from '../lib/server/api-core.mjs'

test('methodAllowed checks the request method against allowed methods', () => {
  assert.equal(methodAllowed('GET', ['GET']), true)
  assert.equal(methodAllowed('POST', ['GET']), false)
})

test('formatAllowHeader creates a stable Allow header value', () => {
  assert.equal(formatAllowHeader(['GET', 'POST']), 'GET, POST')
})

test('API errors preserve status code and response details', () => {
  const error = createValidationError('Invalid track id', { trackId: 'abc' })

  assert.ok(error instanceof ApiError)
  assert.deepEqual(toErrorResponse(error), {
    statusCode: 400,
    body: {
      message: 'Invalid track id',
      details: {
        trackId: 'abc'
      }
    }
  })
})

test('method and auth helpers produce consistent API errors', () => {
  assert.deepEqual(toErrorResponse(createMethodNotAllowedError(['GET'])), {
    statusCode: 405,
    body: {
      message: 'Method not allowed. Use GET.'
    }
  })

  assert.deepEqual(toErrorResponse(createAuthenticationError()), {
    statusCode: 401,
    body: {
      message: 'Authentication required'
    }
  })

  assert.deepEqual(toErrorResponse(createForbiddenError('Admin access required')), {
    statusCode: 403,
    body: {
      message: 'Admin access required'
    }
  })
})

test('unexpected errors serialize as generic server failures', () => {
  assert.deepEqual(toErrorResponse(new Error('database password leaked here')), {
    statusCode: 500,
    body: {
      message: 'Internal server error'
    }
  })
})

test('error responses include request id when provided', () => {
  assert.deepEqual(toErrorResponse(createAuthenticationError(), { requestId: 'req-123' }), {
    statusCode: 401,
    body: {
      message: 'Authentication required',
      requestId: 'req-123'
    }
  })

  assert.deepEqual(toErrorResponse(new Error('database exploded'), { requestId: 'req-123' }), {
    statusCode: 500,
    body: {
      message: 'Internal server error',
      requestId: 'req-123'
    }
  })
})

test('conflict errors serialize as stable 409 responses', () => {
  assert.deepEqual(toErrorResponse(createConflictError('Already owned')), {
    statusCode: 409,
    body: {
      message: 'Already owned'
    }
  })
})

test('error headers preserve rate-limit details and request ids', () => {
  const error = createTooManyRequestsError({
    retryAfterSeconds: 30
  })
  error.headers = {
    ...error.headers,
    'X-RateLimit-Limit': '12',
    'X-RateLimit-Remaining': '0',
    'X-RateLimit-Reset': '123'
  }

  assert.deepEqual(toErrorHeaders(error, { requestId: 'req-123' }), {
    'Retry-After': '30',
    'X-RateLimit-Limit': '12',
    'X-RateLimit-Remaining': '0',
    'X-RateLimit-Reset': '123',
    'X-Request-Id': 'req-123'
  })
})
