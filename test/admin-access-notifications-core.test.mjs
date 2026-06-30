import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildAdminAccessReviewUrl,
  buildUserAccessChangeRequestEmail,
  getRequestedAccessChanges,
  parseEmailRecipients
} from '../lib/server/admin-access-notifications-core.mjs'

test('notification recipients are trimmed and deduplicated', () => {
  assert.deepEqual(
    parseEmailRecipients('security@example.com, ops@example.com, security@example.com, ,'),
    ['security@example.com', 'ops@example.com']
  )
})

test('requested access changes describe changed access fields only', () => {
  assert.deepEqual(
    getRequestedAccessChanges({
      requestedRole: 'ADMIN',
      requestedAccountStatus: null,
      requestedUploaderStatus: 'APPROVED'
    }),
    ['role -> ADMIN', 'uploader status -> APPROVED']
  )
})

test('admin review URL points reviewers to operations tab', () => {
  assert.equal(
    buildAdminAccessReviewUrl({
      baseUrl: 'https://cmc.example.com',
      requestId: 42
    }),
    'https://cmc.example.com/admin?tab=operations'
  )
})

test('access review email includes review context without requester reason text', () => {
  const message = buildUserAccessChangeRequestEmail({
    appUrl: 'https://cmc.example.com',
    request: {
      id: 42,
      requestedRole: 'ADMIN',
      requestedAccountStatus: 'ACTIVE',
      reason: 'Do not put this in outbound email',
      createdAt: new Date('2026-06-30T10:00:00.000Z'),
      requestedBy: {
        email: 'admin@example.com'
      },
      targetUser: {
        email: 'artist@example.com'
      }
    }
  })

  assert.equal(message.subject, 'CMC access change review required (#42)')
  assert.match(message.text, /Requested by: admin@example\.com/)
  assert.match(message.text, /Target user: artist@example\.com/)
  assert.match(message.text, /role -> ADMIN/)
  assert.match(message.text, /account status -> ACTIVE/)
  assert.match(message.text, /https:\/\/cmc\.example\.com\/admin\?tab=operations/)
  assert.doesNotMatch(message.text, /Do not put this/)
})
