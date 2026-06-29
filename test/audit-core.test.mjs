import assert from 'node:assert/strict'
import test from 'node:test'
import {
  auditActions,
  buildAuditEventData,
  buildRateLimitExceededMetadata,
  buildTrackAccessDeniedMetadata,
  serializeAuditMetadata
} from '../lib/server/audit-core.mjs'

test('serializeAuditMetadata omits empty metadata', () => {
  assert.equal(serializeAuditMetadata(), undefined)
  assert.equal(serializeAuditMetadata({}), undefined)
})

test('track access denied metadata records safe support context', () => {
  assert.deepEqual(
    buildTrackAccessDeniedMetadata({
      mode: 'download',
      reason: 'track_access_denied',
      redirect: '1',
      route: '/api/tracks/[trackId]/signed-url'
    }),
    {
      mode: 'download',
      reason: 'track_access_denied',
      redirect: true,
      route: '/api/tracks/[trackId]/signed-url'
    }
  )
})

test('rate limit exceeded metadata records limit context without actor identifiers', () => {
  assert.deepEqual(
    buildRateLimitExceededMetadata({
      limit: 12,
      remaining: 0,
      resetAt: 12345,
      route: '/api/stripe/checkout_sessions',
      scope: 'checkout.session'
    }),
    {
      limit: 12,
      remaining: 0,
      resetAt: 12345,
      route: '/api/stripe/checkout_sessions',
      scope: 'checkout.session'
    }
  )
})

test('serializeAuditMetadata serializes non-empty metadata', () => {
  assert.equal(serializeAuditMetadata({ orderId: 1 }), '{"orderId":1}')
})

test('buildAuditEventData normalizes entity ids and optional actor ids', () => {
  assert.deepEqual(
    buildAuditEventData({
      action: auditActions.checkoutCreated,
      actorId: '',
      entityType: 'Order',
      entityId: 123,
      metadata: {
        amountTotal: 299
      }
    }),
    {
      action: 'checkout.created',
      actorId: undefined,
      entityType: 'Order',
      entityId: '123',
      metadata: '{"amountTotal":299}'
    }
  )
})
