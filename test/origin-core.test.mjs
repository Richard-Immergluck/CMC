import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getRequestOriginPosture,
  getUrlOrigin
} from '../lib/server/origin-core.mjs'

test('url origin parsing returns stable origins', () => {
  assert.equal(getUrlOrigin('https://example.com/catalogue?track=1'), 'https://example.com')
  assert.equal(getUrlOrigin('http://localhost:3000/upload'), 'http://localhost:3000')
  assert.equal(getUrlOrigin('not-a-url'), null)
  assert.equal(getUrlOrigin(undefined), null)
})

test('request origin posture allows same-origin browser mutations', () => {
  assert.deepEqual(
    getRequestOriginPosture({
      requestUrl: 'https://cmc.example.com/api/tracks',
      originHeader: 'https://cmc.example.com',
      refererHeader: null
    }),
    {
      trusted: true,
      reason: 'same_origin',
      requestOrigin: 'https://cmc.example.com',
      allowedOrigins: ['https://cmc.example.com'],
      suppliedOrigin: 'https://cmc.example.com'
    }
  )
})

test('request origin posture allows API clients without browser origin headers', () => {
  assert.deepEqual(
    getRequestOriginPosture({
      requestUrl: 'https://cmc.example.com/api/tracks',
      originHeader: null,
      refererHeader: null
    }),
    {
      trusted: true,
      reason: 'missing_origin_headers'
    }
  )
})

test('request origin posture falls back to referer when origin is absent', () => {
  assert.deepEqual(
    getRequestOriginPosture({
      requestUrl: 'https://cmc.example.com/api/profile',
      originHeader: null,
      refererHeader: 'https://cmc.example.com/profile'
    }),
    {
      trusted: true,
      reason: 'same_origin',
      requestOrigin: 'https://cmc.example.com',
      allowedOrigins: ['https://cmc.example.com'],
      suppliedOrigin: 'https://cmc.example.com'
    }
  )
})

test('request origin posture allows configured deployment origins', () => {
  assert.deepEqual(
    getRequestOriginPosture({
      requestUrl: 'http://127.0.0.1:3000/api/profile',
      originHeader: 'https://preview.example.com',
      refererHeader: null,
      trustedOrigins: ['https://preview.example.com']
    }),
    {
      trusted: true,
      reason: 'same_origin',
      requestOrigin: 'http://127.0.0.1:3000',
      allowedOrigins: ['http://127.0.0.1:3000', 'http://localhost:3000', 'https://preview.example.com'],
      suppliedOrigin: 'https://preview.example.com'
    }
  )
})

test('request origin posture allows localhost and loopback aliases in development', () => {
  assert.deepEqual(
    getRequestOriginPosture({
      requestUrl: 'http://localhost:3000/api/track-requests',
      originHeader: 'http://127.0.0.1:3000',
      refererHeader: null
    }),
    {
      trusted: true,
      reason: 'same_origin',
      requestOrigin: 'http://localhost:3000',
      allowedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      suppliedOrigin: 'http://127.0.0.1:3000'
    }
  )
})

test('request origin posture rejects cross-origin browser mutations', () => {
  assert.deepEqual(
    getRequestOriginPosture({
      requestUrl: 'https://cmc.example.com/api/tracks',
      originHeader: 'https://evil.example.com',
      refererHeader: null
    }),
    {
      trusted: false,
      reason: 'origin_mismatch',
      requestOrigin: 'https://cmc.example.com',
      allowedOrigins: ['https://cmc.example.com'],
      suppliedOrigin: 'https://evil.example.com'
    }
  )
})

test('request origin posture rejects supplied origins when request url is invalid', () => {
  assert.deepEqual(
    getRequestOriginPosture({
      requestUrl: 'not-a-url',
      originHeader: 'https://cmc.example.com',
      refererHeader: null
    }),
    {
      trusted: false,
      reason: 'invalid_request_url'
    }
  )
})
