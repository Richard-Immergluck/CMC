import assert from 'node:assert/strict'
import test from 'node:test'
import { requireActiveApiUser } from '../lib/server/route-auth-core.mjs'

const activeUser = {
  id: 'user-1',
  accountStatus: 'ACTIVE'
}

test('active API user guard returns active users', () => {
  assert.equal(requireActiveApiUser(activeUser), activeUser)
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
