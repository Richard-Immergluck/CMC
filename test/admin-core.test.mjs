import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildTrackModerationChangeMetadata,
  buildUserAccessChangeMetadata,
  toAuditEventAdminItem,
  toAdminSummary,
  toOrderAdminItem,
  toPaymentEventAdminItem,
  toTrackReviewItem,
  toUserAdminItem
} from '../lib/server/admin-core.mjs'

test('admin summary uses stable count names', () => {
  assert.deepEqual(
    toAdminSummary({
      userCount: 2,
      trackCount: 3,
      pendingTrackCount: 1,
      orderCount: 4,
      paymentEventCount: 5,
      auditEventCount: 6
    }),
    {
      users: 2,
      tracks: 3,
      pendingTracks: 1,
      orders: 4,
      paymentEvents: 5,
      auditEvents: 6
    }
  )
})

test('track review items expose moderation context and uploader identity only', () => {
  assert.deepEqual(
    toTrackReviewItem({
      id: 1,
      title: 'Draft Track',
      composer: 'Composer',
      status: 'DRAFT',
      moderationStatus: 'PENDING',
      processingStatus: 'READY',
      uploadedAt: new Date('2026-06-25T12:00:00.000Z'),
      uploadedBy: {
        id: 'user-1',
        name: 'Uploader',
        email: 'uploader@example.com',
        access_token: 'should-not-leak'
      }
    }),
    {
      id: 1,
      title: 'Draft Track',
      composer: 'Composer',
      status: 'DRAFT',
      moderationStatus: 'PENDING',
      processingStatus: 'READY',
      uploadedAt: new Date('2026-06-25T12:00:00.000Z'),
      uploader: {
        id: 'user-1',
        name: 'Uploader',
        email: 'uploader@example.com'
      }
    }
  )
})

test('user admin items expose role and status without provider account data', () => {
  assert.deepEqual(
    toUserAdminItem({
      id: 'user-1',
      name: 'Customer',
      email: 'customer@example.com',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      uploaderStatus: 'NOT_REQUESTED',
      accounts: [
        {
          access_token: 'should-not-leak'
        }
      ]
    }),
    {
      id: 'user-1',
      name: 'Customer',
      email: 'customer@example.com',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      uploaderStatus: 'NOT_REQUESTED'
    }
  )
})

test('order admin items expose commerce context without provider user data', () => {
  assert.deepEqual(
    toOrderAdminItem({
      id: 12,
      status: 'PAID',
      amountTotal: 475,
      currency: 'gbp',
      stripeCheckoutSession: 'cs_test_1',
      stripePaymentIntent: 'pi_test_1',
      createdAt: new Date('2026-06-25T12:00:00.000Z'),
      updatedAt: new Date('2026-06-25T12:05:00.000Z'),
      user: {
        id: 'user-1',
        name: 'Customer',
        email: 'customer@example.com',
        access_token: 'should-not-leak'
      },
      items: [
        {
          id: 1,
          trackId: 3,
          title: 'Study',
          composer: 'Composer',
          unitAmount: 475,
          currency: 'gbp',
          internalCost: 'ignored'
        }
      ]
    }),
    {
      id: 12,
      status: 'PAID',
      amountTotal: 475,
      currency: 'gbp',
      stripeCheckoutSession: 'cs_test_1',
      stripePaymentIntent: 'pi_test_1',
      createdAt: new Date('2026-06-25T12:00:00.000Z'),
      updatedAt: new Date('2026-06-25T12:05:00.000Z'),
      user: {
        id: 'user-1',
        name: 'Customer',
        email: 'customer@example.com'
      },
      items: [
        {
          id: 1,
          trackId: 3,
          title: 'Study',
          composer: 'Composer',
          unitAmount: 475,
          currency: 'gbp'
        }
      ]
    }
  )
})

test('payment event admin items omit raw Stripe payloads', () => {
  assert.deepEqual(
    toPaymentEventAdminItem({
      id: 1,
      stripeEventId: 'evt_1',
      type: 'checkout.session.completed',
      orderId: 12,
      payload: '{"secret":"should-not-leak"}',
      processedAt: new Date('2026-06-25T12:00:00.000Z')
    }),
    {
      id: 1,
      stripeEventId: 'evt_1',
      type: 'checkout.session.completed',
      orderId: 12,
      processedAt: new Date('2026-06-25T12:00:00.000Z')
    }
  )
})

test('audit event admin items expose actor identity without metadata payloads', () => {
  assert.deepEqual(
    toAuditEventAdminItem({
      id: 1,
      action: 'ownership.granted',
      entityType: 'Track',
      entityId: '3',
      metadata: '{"stripeCheckoutSession":"cs_test_1"}',
      createdAt: new Date('2026-06-25T12:00:00.000Z'),
      actor: {
        id: 'user-1',
        name: 'Customer',
        email: 'customer@example.com',
        access_token: 'should-not-leak'
      }
    }),
    {
      id: 1,
      action: 'ownership.granted',
      entityType: 'Track',
      entityId: '3',
      createdAt: new Date('2026-06-25T12:00:00.000Z'),
      actor: {
        id: 'user-1',
        name: 'Customer',
        email: 'customer@example.com'
      }
    }
  )
})

test('user access change metadata captures before and after safe fields', () => {
  assert.deepEqual(
    buildUserAccessChangeMetadata({
      before: {
        id: 'user-1',
        name: 'Uploader',
        email: 'uploader@example.com',
        role: 'CUSTOMER',
        accountStatus: 'ACTIVE',
        uploaderStatus: 'NOT_REQUESTED',
        access_token: 'should-not-leak'
      },
      after: {
        id: 'user-1',
        name: 'Uploader',
        email: 'uploader@example.com',
        role: 'UPLOADER',
        accountStatus: 'ACTIVE',
        uploaderStatus: 'APPROVED',
        access_token: 'should-not-leak'
      }
    }),
    {
      before: {
        id: 'user-1',
        name: 'Uploader',
        email: 'uploader@example.com',
        role: 'CUSTOMER',
        accountStatus: 'ACTIVE',
        uploaderStatus: 'NOT_REQUESTED'
      },
      after: {
        id: 'user-1',
        name: 'Uploader',
        email: 'uploader@example.com',
        role: 'UPLOADER',
        accountStatus: 'ACTIVE',
        uploaderStatus: 'APPROVED'
      }
    }
  )
})

test('track moderation metadata captures workflow status changes', () => {
  assert.deepEqual(
    buildTrackModerationChangeMetadata({
      before: {
        status: 'DRAFT',
        moderationStatus: 'PENDING',
        processingStatus: 'READY',
        title: 'Ignored'
      },
      after: {
        status: 'PUBLISHED',
        moderationStatus: 'APPROVED',
        processingStatus: 'READY',
        title: 'Ignored'
      }
    }),
    {
      before: {
        status: 'DRAFT',
        moderationStatus: 'PENDING',
        processingStatus: 'READY'
      },
      after: {
        status: 'PUBLISHED',
        moderationStatus: 'APPROVED',
        processingStatus: 'READY'
      }
    }
  )
})
