import assert from 'node:assert/strict'
import test from 'node:test'
import { createRouteTelemetryCore } from '../lib/server/route-telemetry-core.mjs'

test('route telemetry emits start and completion events with duration', () => {
  const events = []
  let timestamp = 1000
  const telemetry = createRouteTelemetryCore({
    requestId: 'req-123',
    method: 'POST',
    route: '/api/uploads/signed-url',
    event: 'upload.signed_url',
    metadata: {
      surface: 'upload'
    },
    logger: event => events.push(event),
    now: () => timestamp
  })

  timestamp = 1127
  telemetry.complete({
    statusCode: 200,
    contentType: 'audio/mpeg'
  })

  assert.equal(telemetry.requestId, 'req-123')
  assert.deepEqual(events, [
    {
      event: 'upload.signed_url.started',
      message: '/api/uploads/signed-url started',
      requestId: 'req-123',
      metadata: {
        route: '/api/uploads/signed-url',
        method: 'POST',
        surface: 'upload'
      }
    },
    {
      event: 'upload.signed_url.completed',
      message: '/api/uploads/signed-url completed',
      requestId: 'req-123',
      metadata: {
        route: '/api/uploads/signed-url',
        method: 'POST',
        surface: 'upload',
        statusCode: 200,
        contentType: 'audio/mpeg',
        durationMs: 127
      }
    }
  ])
})

test('route telemetry emits failure events without negative durations', () => {
  const events = []
  let timestamp = 5000
  const telemetry = createRouteTelemetryCore({
    requestId: 'req-123',
    method: 'GET',
    route: '/api/stripe/checkout_sessions',
    event: 'checkout.session',
    logger: event => events.push(event),
    now: () => timestamp
  })

  timestamp = 4999
  telemetry.fail(new TypeError('Stripe unavailable'), {
    statusCode: 500
  })

  assert.equal(events[1].level, 'error')
  assert.deepEqual(events[1].metadata, {
    route: '/api/stripe/checkout_sessions',
    method: 'GET',
    statusCode: 500,
    durationMs: 0,
    errorName: 'TypeError',
    errorMessage: 'Stripe unavailable'
  })
})
