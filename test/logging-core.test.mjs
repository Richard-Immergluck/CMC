import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createLogEntry,
  createRequestId,
  getRequestId,
  normalizeRequestId,
  redactLogMetadata
} from '../lib/server/logging-core.mjs'

test('request ids prefer incoming correlation headers', () => {
  assert.equal(
    getRequestId({
      headers: {
        'x-request-id': 'req-123'
      }
    }),
    'req-123'
  )

  assert.equal(
    getRequestId({
      headers: {
        'x-correlation-id': ['correlation-123']
      }
    }),
    'correlation-123'
  )
})

test('request ids are normalized before being reflected', () => {
  assert.equal(normalizeRequestId('req-123'), 'req-123')
  assert.equal(normalizeRequestId(' req_123:abc.def '), 'req_123:abc.def')
  assert.equal(normalizeRequestId(['correlation-123']), 'correlation-123')
  assert.equal(normalizeRequestId('req with spaces'), undefined)
  assert.equal(normalizeRequestId('req\nmalicious'), undefined)
  assert.equal(normalizeRequestId('x'.repeat(129)), undefined)
  assert.equal(normalizeRequestId(42), undefined)
})

test('invalid incoming request ids fall back to generated values', () => {
  assert.notEqual(
    getRequestId({
      headers: {
        'x-request-id': 'req\nmalicious'
      }
    }),
    'req\nmalicious'
  )
})

test('request id generation uses random uuid when available', () => {
  assert.equal(
    createRequestId({
      randomUUID: () => 'generated-request-id'
    }),
    'generated-request-id'
  )
})

test('log metadata redacts secret-like fields', () => {
  assert.deepEqual(
    redactLogMetadata({
      trackId: 42,
      stripeSecretKey: 'sk_test_secret',
      authorization: 'Bearer token'
    }),
    {
      trackId: 42,
      stripeSecretKey: '[REDACTED]',
      authorization: '[REDACTED]'
    }
  )
})

test('structured log entries include stable event context', () => {
  const entry = createLogEntry({
    level: 'info',
    event: 'checkout.created',
    message: 'Checkout created',
    requestId: 'req-123',
    metadata: {
      orderId: 1
    }
  })

  assert.equal(entry.level, 'info')
  assert.equal(entry.event, 'checkout.created')
  assert.equal(entry.requestId, 'req-123')
  assert.deepEqual(entry.metadata, { orderId: 1 })
  assert.match(entry.timestamp, /^\d{4}-\d{2}-\d{2}T/)
})
