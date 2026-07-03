import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getActiveApiUserPosture,
  getRouteSessionAgePosture,
  getRouteSessionIdentityPosture,
  parseSensitiveSessionMaxAgeMinutes,
  requireActiveApiUser,
  requireFreshRouteSessionUser
} from '../lib/server/route-auth-core.mjs'

const activeUser = {
  id: 'user-1',
  accountStatus: 'ACTIVE'
}

test('active API user guard returns active users', () => {
  assert.equal(requireActiveApiUser(activeUser), activeUser)
  assert.deepEqual(getActiveApiUserPosture(activeUser), {
    valid: true,
    reason: 'active'
  })
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

test('sensitive session max age parser accepts only bounded positive integers', () => {
  assert.equal(parseSensitiveSessionMaxAgeMinutes(undefined), null)
  assert.equal(parseSensitiveSessionMaxAgeMinutes(''), null)
  assert.equal(parseSensitiveSessionMaxAgeMinutes('15'), 15)
  assert.equal(parseSensitiveSessionMaxAgeMinutes(60), 60)
  assert.equal(parseSensitiveSessionMaxAgeMinutes('0'), null)
  assert.equal(parseSensitiveSessionMaxAgeMinutes('-1'), null)
  assert.equal(parseSensitiveSessionMaxAgeMinutes('1.5'), null)
  assert.equal(parseSensitiveSessionMaxAgeMinutes(String(24 * 60 + 1)), null)
})

test('route session age posture is disabled when no max age is configured', () => {
  assert.deepEqual(
    getRouteSessionAgePosture({
      session: {},
      maxSessionAgeMinutes: null
    }),
    {
      valid: true,
      reason: 'not_required'
    }
  )
})

test('route session age posture rejects missing, invalid, future, and stale issue times', () => {
  const now = new Date('2026-07-03T10:00:00.000Z')

  assert.deepEqual(
    getRouteSessionAgePosture({
      session: { user: {} },
      maxSessionAgeMinutes: 15,
      now
    }),
    {
      valid: false,
      reason: 'missing_session_issued_at'
    }
  )
  assert.deepEqual(
    getRouteSessionAgePosture({
      session: { user: { sessionIssuedAt: 'not-a-date' } },
      maxSessionAgeMinutes: 15,
      now
    }),
    {
      valid: false,
      reason: 'invalid_session_issued_at'
    }
  )
  assert.deepEqual(
    getRouteSessionAgePosture({
      session: { user: { sessionIssuedAt: '2026-07-03T10:01:00.000Z' } },
      maxSessionAgeMinutes: 15,
      now
    }),
    {
      valid: false,
      reason: 'future_session_issued_at'
    }
  )
  assert.deepEqual(
    getRouteSessionAgePosture({
      session: { user: { sessionIssuedAt: '2026-07-03T09:44:00.000Z' } },
      maxSessionAgeMinutes: 15,
      now
    }),
    {
      valid: false,
      reason: 'session_too_old',
      ageMinutes: 16
    }
  )
})

test('fresh route session guard can require a recent session for sensitive routes', () => {
  const user = {
    id: 'user-1',
    email: 'person@example.com'
  }
  const staleSession = {
    user: {
      id: 'user-1',
      email: 'person@example.com',
      sessionIssuedAt: '2000-01-01T00:00:00.000Z'
    }
  }

  assert.deepEqual(
    getRouteSessionAgePosture({
      session: {
        user: {
          sessionIssuedAt: '2026-07-03T09:50:00.000Z'
        }
      },
      maxSessionAgeMinutes: 15,
      now: new Date('2026-07-03T10:00:00.000Z')
    }),
    {
      valid: true,
      reason: 'fresh',
      ageMinutes: 10
    }
  )
  assert.throws(
    () => requireFreshRouteSessionUser({
      session: staleSession,
      user,
      maxSessionAgeMinutes: 15
    }),
    error => error.statusCode === 403 && error.message === 'Recent authenticated session required'
  )
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
    assert.deepEqual(
      getActiveApiUserPosture({
        id: 'user-1',
        accountStatus
      }),
      {
        valid: false,
        reason: 'inactive_account'
      }
    )
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
  assert.deepEqual(getActiveApiUserPosture(null), {
    valid: false,
    reason: 'missing_user'
  })
  assert.throws(
    () => requireActiveApiUser(null),
    error => error.statusCode === 403 && error.message === 'Active account required'
  )
})
