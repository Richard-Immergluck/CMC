import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeTrackItems } from '../lib/server/works-collections-core.mjs'

test('normalizeTrackItems preserves legacy trackIds as ordered release items', () => {
  assert.deepEqual(
    normalizeTrackItems({
      trackIds: ['12', 11]
    }),
    [
      {
        position: 1,
        titleInWork: null,
        trackId: 12
      },
      {
        position: 2,
        titleInWork: null,
        trackId: 11
      }
    ]
  )
})

test('normalizeTrackItems sorts explicit positions and compacts release order', () => {
  assert.deepEqual(
    normalizeTrackItems({
      trackItems: [
        {
          position: 20,
          titleInWork: 'III. Finale',
          trackId: 33
        },
        {
          position: 10,
          titleInWork: 'I. Opening',
          trackId: 31
        }
      ]
    }),
    [
      {
        position: 1,
        titleInWork: 'I. Opening',
        trackId: 31
      },
      {
        position: 2,
        titleInWork: 'III. Finale',
        trackId: 33
      }
    ]
  )
})

test('normalizeTrackItems rejects duplicate track ids', () => {
  assert.throws(
    () => normalizeTrackItems({
      trackItems: [
        {
          trackId: 31
        },
        {
          trackId: '31'
        }
      ]
    }),
    error => error.statusCode === 400
  )
})
