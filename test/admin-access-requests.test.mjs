import assert from 'node:assert/strict'
import test from 'node:test'
import {
  toUserAccessChangeRequestData,
  toUserAccessUpdateData
} from '../lib/server/admin-access-requests-core.mjs'

test('user access update data omits request-only fields', () => {
  assert.deepEqual(
    toUserAccessUpdateData({
      role: 'SUPPORT',
      accountStatus: 'ACTIVE',
      reason: 'Temporary support cover'
    }),
    {
      role: 'SUPPORT',
      accountStatus: 'ACTIVE'
    }
  )
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
