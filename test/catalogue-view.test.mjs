import assert from 'node:assert/strict'
import test from 'node:test'
import {
  catalogueModes,
  getCatalogueContext
} from '../lib/catalogue-view.mjs'

const activeUser = overrides => ({
  accountStatus: 'ACTIVE',
  id: 'user-1',
  role: 'CUSTOMER',
  uploaderStatus: 'NOT_REQUESTED',
  ...overrides
})

test('anonymous visitors get a public catalogue context', () => {
  assert.deepEqual(getCatalogueContext(null), {
    mode: catalogueModes.public,
    isAuthenticated: false,
    role: null,
    userId: null,
    userName: null,
    canAccessAdmin: false,
    canAccessSupport: false,
    canUpload: false,
    showMemberActions: false,
    showUploaderContext: false,
    showOperationsOverlay: false
  })
})

test('customers get member catalogue actions without operations overlays', () => {
  assert.deepEqual(getCatalogueContext(activeUser()), {
    mode: catalogueModes.member,
    isAuthenticated: true,
    role: 'CUSTOMER',
    userId: 'user-1',
    userName: null,
    canAccessAdmin: false,
    canAccessSupport: false,
    canUpload: false,
    showMemberActions: true,
    showUploaderContext: false,
    showOperationsOverlay: false
  })
})

test('approved uploaders get uploader catalogue context', () => {
  const context = getCatalogueContext(activeUser({
    role: 'UPLOADER',
    uploaderStatus: 'APPROVED'
  }))

  assert.equal(context.mode, catalogueModes.uploader)
  assert.equal(context.canUpload, true)
  assert.equal(context.showUploaderContext, true)
  assert.equal(context.showOperationsOverlay, false)
})

test('support and admin users get operations overlays with distinct access', () => {
  const supportContext = getCatalogueContext(activeUser({ role: 'SUPPORT' }))
  const adminContext = getCatalogueContext(activeUser({ role: 'ADMIN' }))

  assert.equal(supportContext.mode, catalogueModes.support)
  assert.equal(supportContext.canAccessAdmin, false)
  assert.equal(supportContext.canAccessSupport, true)
  assert.equal(supportContext.showOperationsOverlay, true)

  assert.equal(adminContext.mode, catalogueModes.admin)
  assert.equal(adminContext.canAccessAdmin, true)
  assert.equal(adminContext.canAccessSupport, true)
  assert.equal(adminContext.showUploaderContext, true)
  assert.equal(adminContext.showOperationsOverlay, true)
})
