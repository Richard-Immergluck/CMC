import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canUpdateUserAccess,
  canAccessAdminSurface,
  canAccessSupportSurface,
  canStartTrackUpload,
  canUploadTracks,
  requireAdminPermission,
  requireSupportPermission,
  requireTrackUploadPermission
} from '../lib/server/permissions.mjs'

const activeCustomer = {
  role: 'CUSTOMER',
  accountStatus: 'ACTIVE',
  uploaderStatus: 'NOT_REQUESTED'
}

const approvedUploader = {
  role: 'UPLOADER',
  accountStatus: 'ACTIVE',
  uploaderStatus: 'APPROVED'
}

const user = ({ role, accountStatus = 'ACTIVE', uploaderStatus = 'NOT_REQUESTED' }) => ({
  role,
  accountStatus,
  uploaderStatus
})

test('established uploader features require an active approved uploader or admin', () => {
  assert.equal(canUploadTracks(activeCustomer), false)
  assert.equal(canUploadTracks(approvedUploader), true)
  assert.equal(canUploadTracks({
    role: 'ADMIN',
    accountStatus: 'ACTIVE',
    uploaderStatus: 'NOT_REQUESTED'
  }), true)
  assert.equal(canUploadTracks({
    role: 'UPLOADER',
    accountStatus: 'SUSPENDED',
    uploaderStatus: 'APPROVED'
  }), false)
  assert.equal(canUploadTracks({
    role: 'UPLOADER',
    accountStatus: 'ACTIVE',
    uploaderStatus: 'PENDING'
  }), false)
})

test('track upload submission is available to any active account', () => {
  assert.equal(canStartTrackUpload(activeCustomer), true)
  assert.equal(canStartTrackUpload(approvedUploader), true)
  assert.equal(canStartTrackUpload(user({ role: 'SUPPORT' })), true)
  assert.equal(canStartTrackUpload(user({ role: 'ADMIN' })), true)
  assert.equal(canStartTrackUpload(user({ role: 'CUSTOMER', accountStatus: 'SUSPENDED' })), false)
})

test('role permissions preserve admin support and customer boundaries', () => {
  const expectations = [
    {
      role: 'CUSTOMER',
      admin: false,
      support: false,
      upload: false
    },
    {
      role: 'UPLOADER',
      admin: false,
      support: false,
      upload: true,
      uploaderStatus: 'APPROVED'
    },
    {
      role: 'SUPPORT',
      admin: false,
      support: true,
      upload: false
    },
    {
      role: 'ADMIN',
      admin: true,
      support: true,
      upload: true
    }
  ]

  for (const expectation of expectations) {
    const currentUser = user({
      role: expectation.role,
      uploaderStatus: expectation.uploaderStatus
    })

    assert.equal(canAccessAdminSurface(currentUser), expectation.admin)
    assert.equal(canAccessSupportSurface(currentUser), expectation.support)
    assert.equal(canUploadTracks(currentUser), expectation.upload)
  }
})

test('inactive accounts cannot use elevated role permissions', () => {
  for (const accountStatus of ['SUSPENDED', 'CLOSED']) {
    for (const role of ['CUSTOMER', 'UPLOADER', 'SUPPORT', 'ADMIN']) {
      const currentUser = user({
        role,
        accountStatus,
        uploaderStatus: 'APPROVED'
      })

      assert.equal(canAccessAdminSurface(currentUser), false)
      assert.equal(canAccessSupportSurface(currentUser), false)
      assert.equal(canUploadTracks(currentUser), false)
    }
  }
})

test('admin and support surfaces have separate permissions', () => {
  assert.equal(canAccessAdminSurface({
    role: 'ADMIN',
    accountStatus: 'ACTIVE'
  }), true)
  assert.equal(canAccessAdminSurface({
    role: 'SUPPORT',
    accountStatus: 'ACTIVE'
  }), false)
  assert.equal(canAccessSupportSurface({
    role: 'SUPPORT',
    accountStatus: 'ACTIVE'
  }), true)
  assert.equal(canAccessSupportSurface({
    role: 'ADMIN',
    accountStatus: 'ACTIVE'
  }), true)
})

test('user access updates cannot target the acting admin', () => {
  assert.equal(canUpdateUserAccess({
    actorId: 'admin-1',
    targetUserId: 'user-2'
  }), true)
  assert.equal(canUpdateUserAccess({
    actorId: 'admin-1',
    targetUserId: 'admin-1'
  }), false)
  assert.equal(canUpdateUserAccess({
    actorId: '',
    targetUserId: 'user-2'
  }), false)
})

test('permission requirements throw stable forbidden errors', () => {
  assert.equal(requireTrackUploadPermission(approvedUploader), approvedUploader)
  assert.equal(requireTrackUploadPermission(activeCustomer), activeCustomer)
  assert.equal(requireAdminPermission(user({ role: 'ADMIN' })).role, 'ADMIN')
  assert.equal(requireSupportPermission(user({ role: 'SUPPORT' })).role, 'SUPPORT')

  assert.throws(
    () => requireTrackUploadPermission(user({ role: 'CUSTOMER', accountStatus: 'SUSPENDED' })),
    error => error.statusCode === 403 && error.message === 'Active account required to upload tracks'
  )

  assert.throws(
    () => requireAdminPermission(user({ role: 'SUPPORT' })),
    error => error.statusCode === 403 && error.message === 'Admin access required'
  )

  assert.throws(
    () => requireSupportPermission(activeCustomer),
    error => error.statusCode === 403 && error.message === 'Support access required'
  )
})
