import assert from 'node:assert/strict'
import test from 'node:test'
import {
  auditActions,
  buildAuditEventData,
  buildAuthSignInDeniedMetadata,
  buildCommentCreatedMetadata,
  buildRateLimitExceededMetadata,
  buildTrackAccessDeniedMetadata,
  buildTrackSignedUrlIssuedMetadata,
  buildUserAccessDeniedMetadata,
  buildTrackSubmittedMetadata,
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

test('sign-in denied metadata records account posture without provider payloads', () => {
  assert.deepEqual(
    buildAuthSignInDeniedMetadata({
      accountStatus: 'SUSPENDED',
      provider: 'google',
      reason: 'inactive_account',
      accessToken: 'should-not-leak'
    }),
    {
      accountStatus: 'SUSPENDED',
      provider: 'google',
      reason: 'inactive_account'
    }
  )
})

test('user access denied metadata records attempted fields without values', () => {
  assert.deepEqual(
    buildUserAccessDeniedMetadata({
      attemptedFields: ['accountStatus', 'role'],
      reason: 'self_access_update',
      route: '/api/admin/users/[userId]',
      role: 'ADMIN'
    }),
    {
      attemptedFields: ['accountStatus', 'role'],
      reason: 'self_access_update',
      route: '/api/admin/users/[userId]'
    }
  )
})

test('signed URL issued metadata records access context without signed URLs', () => {
  assert.deepEqual(
    buildTrackSignedUrlIssuedMetadata({
      downloadName: 'Private Track.mp3',
      expiresSeconds: 900,
      mode: 'download',
      redirect: true,
      route: '/api/tracks/[trackId]/signed-url',
      syntheticFixture: false
    }),
    {
      mode: 'download',
      redirect: true,
      route: '/api/tracks/[trackId]/signed-url',
      syntheticFixture: false,
      expiresSeconds: 900,
      hasDownloadName: true
    }
  )
})

test('track submitted metadata omits user-authored catalogue text', () => {
  assert.deepEqual(
    buildTrackSubmittedMetadata({
      currency: 'gbp',
      hasAdditionalInfo: 'Please review carefully',
      pricePence: 299,
      processingStatus: 'READY',
      sourceContentType: 'audio/mpeg',
      status: 'DRAFT',
      moderationStatus: 'PENDING'
    }),
    {
      currency: 'gbp',
      hasAdditionalInfo: true,
      pricePence: 299,
      processingStatus: 'READY',
      sourceContentType: 'audio/mpeg',
      status: 'DRAFT',
      moderationStatus: 'PENDING'
    }
  )
})

test('comment created metadata records context without comment body', () => {
  assert.deepEqual(
    buildCommentCreatedMetadata({
      commentLength: 42,
      route: '/api/profile',
      trackId: 123
    }),
    {
      commentLength: 42,
      route: '/api/profile',
      trackId: 123
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
