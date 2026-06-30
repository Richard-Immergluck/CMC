import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getRouteSessionIdentityPosture,
  requireActiveApiUser,
  requireFreshRouteSessionUser
} from '../lib/server/route-auth-core.mjs'

const activeUser = {
  id: 'user-1',
  accountStatus: 'ACTIVE'
}

test('active API user guard returns active users', () => {
  assert.equal(requireActiveApiUser(activeUser), activeUser)
})

test('route session identity posture requires matching session and user identity', () => {
  const session = {
    user: {
      id: 'user-1',
      email: 'person@example.com'
    }
  }
  const user = {
    id: 'user-1',
    email: 'person@example.com'
  }

  assert.deepEqual(getRouteSessionIdentityPosture({ session, user }), {
    valid: true,
    reason: 'matched'
  })
  assert.equal(requireFreshRouteSessionUser({ session, user }), user)
})

test('route session identity posture rejects stale or malformed sessions', () => {
  const user = {
    id: 'user-1',
    email: 'person@example.com'
  }

  assert.deepEqual(getRouteSessionIdentityPosture({ session: null, user }), {
    valid: false,
    reason: 'missing_user'
  })
  assert.deepEqual(
    getRouteSessionIdentityPosture({
      session: {
        user: {
          id: 'user-2',
          email: 'person@example.com'
        }
      },
      user
    }),
    {
      valid: false,
      reason: 'user_id_mismatch'
    }
  )
  assert.deepEqual(
    getRouteSessionIdentityPosture({
      session: {
        user: {
          id: 'user-1',
          email: 'other@example.com'
        }
      },
      user
    }),
    {
      valid: false,
      reason: 'email_mismatch'
    }
  )
  assert.throws(
    () => requireFreshRouteSessionUser({
      session: {
        user: {
          id: 'user-2',
          email: 'person@example.com'
        }
      },
      user
    }),
    error => error.statusCode === 403 && error.message === 'Fresh authenticated session required'
  )
})

test('active API user guard rejects suspended and closed accounts', () => {
  for (const accountStatus of ['SUSPENDED', 'CLOSED']) {
    assert.throws(
      () => requireActiveApiUser({
        id: 'user-1',
        accountStatus
      }),
      error => error.statusCode === 403 && error.message === 'Active account required'
    )
  }
})

test('active API user guard rejects missing users defensively', () => {
  assert.throws(
    () => requireActiveApiUser(null),
    error => error.statusCode === 403 && error.message === 'Active account required'
  )
})
