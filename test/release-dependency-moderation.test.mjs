import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyReleaseDependencyModerationUpdates,
  getReleaseDependencyModerationUpdates,
  isTrackModerationDecisionReleaseBlocking
} from '../lib/server/release-dependency-moderation.mjs'

test('track moderation decisions identify release-blocking outcomes', () => {
  assert.equal(isTrackModerationDecisionReleaseBlocking('reject'), true)
  assert.equal(isTrackModerationDecisionReleaseBlocking('archive'), true)
  assert.equal(isTrackModerationDecisionReleaseBlocking('approve'), false)
})

test('release dependency moderation updates active releases only', () => {
  assert.deepEqual(
    getReleaseDependencyModerationUpdates({
      decision: 'approve',
      releaseItems: [
        {
          release: {
            id: 1,
            status: 'PUBLISHED',
            title: 'Approved dependency'
          }
        }
      ]
    }),
    []
  )

  assert.deepEqual(
    getReleaseDependencyModerationUpdates({
      decision: 'reject',
      releaseItems: [
        {
          release: {
            id: 1,
            pricingReviewStatus: 'APPROVED',
            status: 'PUBLISHED',
            title: 'Live song cycle'
          }
        },
        {
          release: {
            id: 1,
            pricingReviewStatus: 'APPROVED',
            status: 'PUBLISHED',
            title: 'Live song cycle'
          }
        },
        {
          release: {
            id: 2,
            pricingReviewStatus: 'NEEDS_REVIEW',
            status: 'SUBMITTED',
            title: 'Submitted opera scenes'
          }
        },
        {
          release: {
            id: 3,
            pricingReviewStatus: 'AUTO_APPROVED',
            status: 'DRAFT',
            title: 'Editable draft'
          }
        },
        {
          release: {
            id: 4,
            pricingReviewStatus: 'REJECTED',
            status: 'REJECTED',
            title: 'Rejected release'
          }
        }
      ]
    }),
    [
      {
        id: 1,
        nextStatus: 'NEEDS_CHANGES',
        pricingReviewStatus: 'APPROVED',
        previousStatus: 'PUBLISHED',
        title: 'Live song cycle'
      },
      {
        id: 2,
        nextStatus: 'NEEDS_CHANGES',
        pricingReviewStatus: 'NEEDS_REVIEW',
        previousStatus: 'SUBMITTED',
        title: 'Submitted opera scenes'
      }
    ]
  )
})

test('release dependency moderation applies updates with audit records', async () => {
  const catalogueReleaseUpdates = []
  const auditEvents = []
  const tx = {
    auditEvent: {
      create: async ({ data }) => {
        auditEvents.push(data)
      }
    },
    catalogueRelease: {
      update: async ({ data, where }) => {
        catalogueReleaseUpdates.push({
          data,
          where
        })
      }
    }
  }

  const updates = await applyReleaseDependencyModerationUpdates({
    actorId: 'admin-1',
    decision: 'reject',
    releaseItems: [
      {
        release: {
          id: 10,
          pricingReviewStatus: 'APPROVED',
          status: 'PUBLISHED',
          title: 'Live collection'
        }
      }
    ],
    route: '/api/admin/tracks/[trackId]',
    trackId: 44,
    tx
  })

  assert.deepEqual(updates, [
    {
      id: 10,
      nextStatus: 'NEEDS_CHANGES',
      pricingReviewStatus: 'APPROVED',
      previousStatus: 'PUBLISHED',
      title: 'Live collection'
    }
  ])
  assert.deepEqual(catalogueReleaseUpdates, [
    {
      where: {
        id: 10
      },
      data: {
        status: 'NEEDS_CHANGES'
      }
    }
  ])
  assert.equal(auditEvents.length, 1)
  assert.equal(auditEvents[0].action, 'works_collection.dependency_blocked')
  assert.equal(auditEvents[0].actorId, 'admin-1')
  assert.equal(auditEvents[0].entityType, 'CatalogueRelease')
  assert.equal(auditEvents[0].entityId, '10')
  assert.deepEqual(JSON.parse(auditEvents[0].metadata), {
    after: {
      status: 'NEEDS_CHANGES'
    },
    before: {
      status: 'PUBLISHED'
    },
    decision: 'reject',
    pricingReviewStatus: 'APPROVED',
    route: '/api/admin/tracks/[trackId]',
    title: 'Live collection',
    trackId: 44
  })
})
