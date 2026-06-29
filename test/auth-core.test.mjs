import assert from 'node:assert/strict'
import test from 'node:test'
import {
  authErrors,
  canSignInWithAccountStatus,
  enrichTokenWithUserAccessData,
  getSignInDecision
} from '../lib/server/auth-core.mjs'

test('sign-in account status policy only allows active accounts', () => {
  assert.equal(canSignInWithAccountStatus('ACTIVE'), true)
  assert.equal(canSignInWithAccountStatus('SUSPENDED'), false)
  assert.equal(canSignInWithAccountStatus('CLOSED'), false)
  assert.equal(canSignInWithAccountStatus(undefined), false)
})

test('sign-in decision allows unknown and active users', () => {
  assert.equal(getSignInDecision(null), true)
  assert.equal(getSignInDecision({ accountStatus: 'ACTIVE' }), true)
})

test('sign-in decision redirects inactive users with a stable error code', () => {
  assert.equal(
    getSignInDecision({ accountStatus: 'SUSPENDED' }),
    `/auth/signin?error=${authErrors.inactiveAccount}`
  )
  assert.equal(
    getSignInDecision({ accountStatus: 'CLOSED' }),
    `/auth/signin?error=${authErrors.inactiveAccount}`
  )
})

test('token enrichment copies authorization fields from persisted users', () => {
  assert.deepEqual(
    enrichTokenWithUserAccessData({
      token: {
        email: 'user@example.com'
      },
      user: {
        id: 'user-1',
        role: 'UPLOADER',
        accountStatus: 'ACTIVE',
        uploaderStatus: 'APPROVED'
      }
    }),
    {
      email: 'user@example.com',
      sub: 'user-1',
      role: 'UPLOADER',
      accountStatus: 'ACTIVE',
      uploaderStatus: 'APPROVED'
    }
  )
})
