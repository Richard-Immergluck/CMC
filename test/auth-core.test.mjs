import assert from 'node:assert/strict'
import test from 'node:test'
import {
  authDenialReasons,
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
  assert.deepEqual(getSignInDecision(null), {
    allowed: true
  })
  assert.deepEqual(getSignInDecision({ accountStatus: 'ACTIVE' }), {
    allowed: true
  })
})

test('sign-in decision redirects inactive users with a stable error code', () => {
  for (const accountStatus of ['SUSPENDED', 'CLOSED']) {
    assert.deepEqual(
      getSignInDecision({ accountStatus }),
      {
        allowed: false,
        reason: authDenialReasons.inactiveAccount,
        redirect: `/auth/signin?error=${authErrors.inactiveAccount}`
      }
    )
  }
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
