import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildUserAccessChangeMetadata,
  toAdminSummary,
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
