import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getWorksCollectionPriceContext,
  normalizeTrackItems
} from '../lib/server/works-collections-core.mjs'

test('normalizeTrackItems preserves legacy trackIds as ordered release items', () => {
  assert.deepEqual(
    normalizeTrackItems({
      trackIds: ['12', 11]
    }),
    [
      {
        movementNo: null,
        position: 1,
        titleInWork: null,
        trackId: 12
      },
      {
        movementNo: null,
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
          movementNo: 'III.',
          position: 20,
          titleInWork: 'III. Finale',
          trackId: 33
        },
        {
          movementNo: 'I.',
          position: 10,
          titleInWork: 'I. Opening',
          trackId: 31
        }
      ]
    }),
    [
      {
        movementNo: 'I.',
        position: 1,
        titleInWork: 'I. Opening',
        trackId: 31
      },
      {
        movementNo: 'III.',
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

test('getWorksCollectionPriceContext exposes separate-track totals and savings', () => {
  const priceContext = getWorksCollectionPriceContext({
    pricePence: 799,
    tracks: [
      {
        position: 1,
        track: {
          id: 11,
          title: 'First track',
          pricePence: 499
        }
      },
      {
        position: 2,
        track: {
          id: 12,
          title: 'Second track',
          pricePence: 499
        }
      }
    ]
  })

  assert.equal(priceContext.individualTracksTotalPence, 998)
  assert.equal(priceContext.formattedIndividualTracksTotal, '£9.98')
  assert.equal(priceContext.savingsPence, 199)
  assert.equal(priceContext.formattedSavings, '£1.99')
})

test('getWorksCollectionPriceContext does not report negative savings for premium collections', () => {
  const priceContext = getWorksCollectionPriceContext({
    pricePence: 1499,
    tracks: [
      {
        position: 1,
        track: {
          id: 21,
          title: 'First track',
          pricePence: 499
        }
      },
      {
        position: 2,
        track: {
          id: 22,
          title: 'Second track',
          pricePence: 499
        }
      }
    ]
  })

  assert.equal(priceContext.individualTracksTotalPence, 998)
  assert.equal(priceContext.savingsPence, 0)
  assert.equal(priceContext.formattedSavings, '£0.00')
})
