import assert from 'node:assert/strict'
import test from 'node:test'
import {
  auditEventCategories,
  buildTrackModerationChangeMetadata,
  buildUserAccessChangeMetadata,
  getUserAccessChangeFields,
  requiresSecondReviewForUserAccessChange,
  toAuditEventAdminItem,
  toAuditEventQueryOptions,
  toAdminSummary,
  toOrderAdminItem,
  toPaymentEventAdminItem,
  toTrackReviewItem,
  toUserAccessChangeRequestAdminItem,
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

test('user access change fields ignore omitted values', () => {
  assert.deepEqual(
    getUserAccessChangeFields({
      role: 'ADMIN',
      accountStatus: null,
      reason: 'Needs support access'
    }),
    ['role']
  )
})

test('user access changes require second review for privileged roles', () => {
  assert.equal(
    requiresSecondReviewForUserAccessChange({
      before: {
        role: 'CUSTOMER'
      },
      input: {
        role: 'ADMIN'
      }
    }),
    true
  )
  assert.equal(
    requiresSecondReviewForUserAccessChange({
      before: {
        role: 'SUPPORT'
      },
      input: {
        accountStatus: 'SUSPENDED'
      }
    }),
    true
  )
  assert.equal(
    requiresSecondReviewForUserAccessChange({
      before: {
        role: 'CUSTOMER'
      },
      input: {
        uploaderStatus: 'APPROVED'
      }
    }),
    false
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

test('audit event query options build bounded support filters', () => {
  const createdFrom = new Date('2026-06-01T00:00:00.000Z')
  const createdTo = new Date('2026-06-30T23:59:59.000Z')

  assert.deepEqual(
    toAuditEventQueryOptions({
      action: 'track_access.denied',
      actorId: 'user-1',
      entityType: 'Track',
      entityId: '42',
      createdFrom,
      createdTo,
      limit: 250
    }),
    {
      where: {
        action: 'track_access.denied',
        actorId: 'user-1',
        entityType: 'Track',
        entityId: '42',
        createdAt: {
          gte: createdFrom,
          lte: createdTo
        }
      },
      take: 100,
      orderBy: [
        {
          createdAt: 'desc'
        }
      ]
    }
  )
})

test('audit event query options support account lifecycle category filters', () => {
  const options = toAuditEventQueryOptions({
    auditCategory: 'accountLifecycle'
  })

  assert.deepEqual(options.where, {
    action: {
      in: auditEventCategories.accountLifecycle
    }
  })
  assert.ok(options.where.action.in.includes('auth.sign_in_denied'))
  assert.ok(options.where.action.in.includes('auth.inactive_api_rejected'))
  assert.ok(options.where.action.in.includes('auth.sign_out'))
  assert.ok(options.where.action.in.includes('user_access.updated'))
})

test('audit event query options default to latest 25 rows', () => {
  assert.deepEqual(toAuditEventQueryOptions(), {
    where: {},
    take: 25,
    orderBy: [
      {
        createdAt: 'desc'
      }
    ]
  })
})

test('user access change request admin items expose review context without reasons', () => {
  assert.deepEqual(
    toUserAccessChangeRequestAdminItem({
      id: 7,
      status: 'PENDING',
      requestedRole: 'ADMIN',
      requestedAccountStatus: null,
      requestedUploaderStatus: null,
      reason: 'Sensitive reason',
      reviewNote: 'Sensitive note',
      createdAt: new Date('2026-06-30T09:00:00.000Z'),
      reviewedAt: null,
      appliedAt: null,
      targetUser: {
        id: 'user-1',
        name: 'Target',
        email: 'target@example.com',
        role: 'CUSTOMER',
        accountStatus: 'ACTIVE',
        uploaderStatus: 'NOT_REQUESTED'
      },
      requestedBy: {
        id: 'admin-1',
        name: 'Admin',
        email: 'admin@example.com',
        access_token: 'should-not-leak'
      },
      reviewedBy: null
    }),
    {
      id: 7,
      status: 'PENDING',
      requestedRole: 'ADMIN',
      requestedAccountStatus: null,
      requestedUploaderStatus: null,
      reasonProvided: true,
      reviewNoteProvided: true,
      createdAt: new Date('2026-06-30T09:00:00.000Z'),
      reviewedAt: null,
      appliedAt: null,
      targetUser: {
        id: 'user-1',
        name: 'Target',
        email: 'target@example.com',
        role: 'CUSTOMER',
        accountStatus: 'ACTIVE',
        uploaderStatus: 'NOT_REQUESTED'
      },
      requestedBy: {
        id: 'admin-1',
        name: 'Admin',
        email: 'admin@example.com'
      },
      reviewedBy: null
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
