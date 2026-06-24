import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildOrderItems,
  buildStripeLineItems,
  calculateOrderTotal,
  ensureAllTracksFound,
  ensureNotAlreadyOwned,
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

test('ensureAllTracksFound rejects missing tracks', () => {
  assert.throws(
    () => ensureAllTracksFound({
      requestedTrackIds: [1, 2],
      tracks: [publishedTrack]
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
  assert.equal(toMinorUnits({ pricePence: 350, price: 2.99 }), 350)
  assert.equal(toMinorUnits({ price: 2.99 }), 299)
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

