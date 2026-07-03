import assert from 'node:assert/strict'
import test from 'node:test'
import {
  shouldRevokeSessionsForAccessChange,
  toUserAccessChangeRequestData,
  toUserAccessUpdateData
} from '../lib/server/admin-access-requests-core.mjs'

test('user access update data omits request-only fields', () => {
  const now = new Date('2026-07-03T10:00:00.000Z')

  assert.deepEqual(
    toUserAccessUpdateData(
      {
        role: 'SUPPORT',
        accountStatus: 'ACTIVE',
        reason: 'Temporary support cover'
      },
      { now }
    ),
    {
      role: 'SUPPORT',
      accountStatus: 'ACTIVE',
      sessionRevokedBefore: now
    }
  )
})

test('user access changes revoke existing sessions only for persisted access fields', () => {
  assert.equal(shouldRevokeSessionsForAccessChange({ reason: 'notes only' }), false)
  assert.equal(shouldRevokeSessionsForAccessChange({ role: 'ADMIN' }), true)
  assert.equal(shouldRevokeSessionsForAccessChange({ accountStatus: 'SUSPENDED' }), true)
  assert.equal(shouldRevokeSessionsForAccessChange({ uploaderStatus: 'APPROVED' }), true)
})

test('user access change request data records requested access and reason', () => {
  assert.deepEqual(
    toUserAccessChangeRequestData({
      actorId: 'admin-1',
      targetUserId: 'user-1',
      input: {
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
        reason: 'Incident cover'
      }
    }),
    {
      targetUserId: 'user-1',
      requestedById: 'admin-1',
      requestedRole: 'ADMIN',
      requestedAccountStatus: 'ACTIVE',
      requestedUploaderStatus: undefined,
      reason: 'Incident cover'
    }
  )
})
