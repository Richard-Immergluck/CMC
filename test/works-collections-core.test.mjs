import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getWorksCollectionDeleteResolution,
  normalizeTrackItems
} from '../lib/server/works-collections-core.mjs'

test('normalizeTrackItems sorts positions and rejects duplicate tracks', () => {
  assert.deepEqual(
    normalizeTrackItems({
      trackItems: [
        {
          position: 2,
          titleInWork: 'Second',
          trackId: 20
        },
        {
          movementNo: 'I',
          position: 1,
          titleInWork: 'First',
          trackId: 10
        }
      ]
    }),
    [
      {
        movementNo: 'I',
        position: 1,
        titleInWork: 'First',
        trackId: 10
      },
      {
        movementNo: null,
        position: 2,
        titleInWork: 'Second',
        trackId: 20
      }
    ]
  )

  assert.throws(
    () => normalizeTrackItems({
      trackIds: [10, 10]
    }),
    error => error.statusCode === 400
  )
})

test('works collection delete resolution preserves sold release history', () => {
  assert.deepEqual(
    getWorksCollectionDeleteResolution({
      _count: {
        orderItems: 0,
        trackOwners: 0
      }
    }),
    {
      action: 'delete',
      hasCommerceHistory: false,
      orderItemCount: 0,
      trackOwnerCount: 0
    }
  )

  assert.deepEqual(
    getWorksCollectionDeleteResolution({
      _count: {
        orderItems: 2,
        trackOwners: 5
      }
    }),
    {
      action: 'archive',
      hasCommerceHistory: true,
      orderItemCount: 2,
      trackOwnerCount: 5
    }
  )
})
