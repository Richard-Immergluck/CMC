import assert from 'node:assert/strict'
import test from 'node:test'
import {
  allocateMinorUnits,
  buildReleaseOrderItems,
  buildOrderItems,
  buildStripeLineItems,
  calculateOrderTotal,
  ensureAllReleasesFound,
  ensureAllTracksFound,
  ensureCartHasItems,
  ensureNoDuplicateOrderTracks,
  ensureNotAlreadyOwned,
  normalizeReleaseIds,
  normalizeTrackIds,
  toMinorUnits
} from '../lib/server/orders-core.mjs'

const publishedTrack = {
  id: 1,
  title: 'Bach Study',
  composer: 'Synthetic Composer',
  status: 'PUBLISHED',
  pricePence: 299,
  price: 2.99,
  currency: 'gbp'
}

test('normalizeTrackIds deduplicates valid positive ids', () => {
  assert.deepEqual(normalizeTrackIds(['1', 1, 2]), [1, 2])
})

test('normalizeReleaseIds deduplicates valid positive ids without requiring a release item', () => {
  assert.deepEqual(normalizeReleaseIds(['1', 1, 2]), [1, 2])
  assert.deepEqual(normalizeReleaseIds([]), [])
})

test('normalizeTrackIds rejects empty or invalid carts', () => {
  assert.throws(
    () => normalizeTrackIds([]),
    error => error.statusCode === 400
  )

  assert.throws(
    () => normalizeTrackIds([0, 'abc']),
    error => error.statusCode === 400
  )
})

test('ensureCartHasItems rejects empty mixed checkout carts', () => {
  assert.doesNotThrow(() => ensureCartHasItems({ trackIds: [1], releaseIds: [] }))
  assert.doesNotThrow(() => ensureCartHasItems({ trackIds: [], releaseIds: [2] }))

  assert.throws(
    () => ensureCartHasItems({ trackIds: [], releaseIds: [] }),
    error => error.statusCode === 400
  )
})

test('ensureAllTracksFound rejects missing tracks', () => {
  assert.throws(
    () => ensureAllTracksFound({
      requestedTrackIds: [1, 2],
      tracks: [publishedTrack]
    }),
    error => error.statusCode === 400
  )
})

test('ensureAllReleasesFound rejects missing Works or Collections', () => {
  assert.throws(
    () => ensureAllReleasesFound({
      requestedReleaseIds: [1, 2],
      releases: [{ id: 1 }]
    }),
    error => error.statusCode === 400
  )
})

test('ensureNotAlreadyOwned rejects existing purchases as conflict', () => {
  assert.throws(
    () => ensureNotAlreadyOwned([{ trackId: 1 }]),
    error => error.statusCode === 409
  )
})

test('toMinorUnits prefers integer database minor units', () => {
  assert.equal(toMinorUnits({ pricePence: 399, price: 2.99 }), 399)
  assert.equal(toMinorUnits({ price: 2.99 }), 299)
})

test('allocateMinorUnits preserves total while distributing remainder', () => {
  assert.deepEqual(allocateMinorUnits({ amountTotal: 1000, count: 3 }), [334, 333, 333])
})

test('buildOrderItems accepts only published tracks with valid prices', () => {
  assert.deepEqual(buildOrderItems([publishedTrack]), [
    {
      trackId: 1,
      title: 'Bach Study',
      composer: 'Synthetic Composer',
      unitAmount: 299,
      currency: 'gbp'
    }
  ])

  assert.throws(
    () => buildOrderItems([{ ...publishedTrack, status: 'ARCHIVED' }]),
    error => error.statusCode === 400
  )

  assert.throws(
    () => buildOrderItems([{ ...publishedTrack, pricePence: 0, price: 0 }]),
    error => error.statusCode === 400
  )
})

test('buildReleaseOrderItems allocates a collection price across track entitlements', () => {
  assert.deepEqual(
    buildReleaseOrderItems([
      {
        id: 10,
        title: 'Bach Learning Pack',
        composer: 'J. S. Bach',
        pricePence: 1000,
        currency: 'gbp',
        tracks: [
          {
            titleInWork: 'I. Warmup',
            track: {
              id: 1,
              title: 'Warmup',
              composer: 'J. S. Bach'
            }
          },
          {
            titleInWork: null,
            track: {
              id: 2,
              title: 'Cadence',
              composer: 'J. S. Bach'
            }
          },
          {
            titleInWork: 'III. Cut',
            track: {
              id: 3,
              title: 'Cut',
              composer: null
            }
          }
        ]
      }
    ]),
    [
      {
        trackId: 1,
        sourceReleaseId: 10,
        sourceReleaseTitle: 'Bach Learning Pack',
        title: 'I. Warmup',
        composer: 'J. S. Bach',
        unitAmount: 334,
        currency: 'gbp'
      },
      {
        trackId: 2,
        sourceReleaseId: 10,
        sourceReleaseTitle: 'Bach Learning Pack',
        title: 'Cadence',
        composer: 'J. S. Bach',
        unitAmount: 333,
        currency: 'gbp'
      },
      {
        trackId: 3,
        sourceReleaseId: 10,
        sourceReleaseTitle: 'Bach Learning Pack',
        title: 'III. Cut',
        composer: 'J. S. Bach',
        unitAmount: 333,
        currency: 'gbp'
      }
    ]
  )
})

test('ensureNoDuplicateOrderTracks rejects duplicated track entitlements', () => {
  assert.throws(
    () => ensureNoDuplicateOrderTracks([{ trackId: 1 }, { trackId: 1 }]),
    error => error.statusCode === 409
  )
})

test('calculateOrderTotal rejects non-positive totals', () => {
  assert.equal(calculateOrderTotal([{ unitAmount: 299 }, { unitAmount: 399 }]), 698)

  assert.throws(
    () => calculateOrderTotal([{ unitAmount: 0 }]),
    error => error.statusCode === 400
  )
})

test('buildStripeLineItems preserves server-side price and product metadata', () => {
  assert.deepEqual(
    buildStripeLineItems([
      {
        title: 'Bach Study',
        composer: 'Synthetic Composer',
        unitAmount: 299,
        currency: 'gbp'
      }
    ]),
    [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Bach Study - Synthetic Composer'
          },
          unit_amount: 299
        },
        quantity: 1
      }
    ]
  )
})
