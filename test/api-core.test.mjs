import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ApiError,
  createAuthenticationError,
  createConflictError,
  createMethodNotAllowedError,
  createValidationError,
  formatAllowHeader,
  methodAllowed,
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
})

test('unexpected errors serialize as generic server failures', () => {
  assert.deepEqual(toErrorResponse(new Error('database password leaked here')), {
    statusCode: 500,
    body: {
      message: 'Internal server error'
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
