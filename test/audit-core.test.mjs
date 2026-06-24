import assert from 'node:assert/strict'
import test from 'node:test'
import {
  auditActions,
  buildAuditEventData,
  serializeAuditMetadata
} from '../lib/server/audit-core.mjs'

test('serializeAuditMetadata omits empty metadata', () => {
  assert.equal(serializeAuditMetadata(), undefined)
  assert.equal(serializeAuditMetadata({}), undefined)
})

test('serializeAuditMetadata serializes non-empty metadata', () => {
  assert.equal(serializeAuditMetadata({ orderId: 1 }), '{"orderId":1}')
})

test('buildAuditEventData normalizes entity ids and optional actor ids', () => {
  assert.deepEqual(
    buildAuditEventData({
      action: auditActions.checkoutCreated,
      actorId: '',
      entityType: 'Order',
      entityId: 123,
      metadata: {
        amountTotal: 299
      }
    }),
    {
      action: 'checkout.created',
      actorId: undefined,
      entityType: 'Order',
      entityId: '123',
      metadata: '{"amountTotal":299}'
    }
  )
})

