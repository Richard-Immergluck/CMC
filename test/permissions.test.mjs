import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canAccessAdminSurface,
  canAccessSupportSurface,
  canUploadTracks,
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

test('track uploads require an active approved uploader or admin', () => {
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

test('permission requirements throw stable forbidden errors', () => {
  assert.equal(requireTrackUploadPermission(approvedUploader), approvedUploader)

  assert.throws(
    () => requireTrackUploadPermission(activeCustomer),
    error => error.statusCode === 403 && error.message === 'Approved uploader access required'
  )
})
