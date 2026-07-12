import assert from 'node:assert/strict'
import test from 'node:test'
import {
  collectionMatchesUploadInventorySearch,
  filterUploadInventoryCollections,
  filterUploadInventoryTracks,
  getUploadInventorySearchQuery,
  trackMatchesUploadInventorySearch
} from '../lib/upload-management-inventory.mjs'

test('upload inventory search normalizes empty and spaced queries', () => {
  assert.equal(getUploadInventorySearchQuery('  Mozart  '), 'mozart')
  assert.equal(getUploadInventorySearchQuery(null), '')
})

test('upload inventory track search covers metadata and collection membership', () => {
  const track = {
    collectionMemberships: [
      {
        collectionTitle: 'Winterreise rehearsal set',
        movementNo: 'No. 5',
        titleInWork: 'Der Lindenbaum'
      }
    ],
    composer: 'Franz Schubert',
    formattedPrice: '£2.99',
    instrumentation: 'Piano, voice',
    key: 'E major',
    title: 'Lindenbaum rehearsal'
  }

  assert.equal(trackMatchesUploadInventorySearch({ query: 'schubert', track }), true)
  assert.equal(trackMatchesUploadInventorySearch({ query: 'winterreise', track }), true)
  assert.equal(trackMatchesUploadInventorySearch({ query: 'voice', track }), true)
  assert.equal(trackMatchesUploadInventorySearch({ query: 'brahms', track }), false)
})

test('upload inventory collection search covers lifecycle and track contents', () => {
  const collection = {
    catalogueType: 'SONG_CYCLE',
    composer: 'Franz Schubert',
    formattedPrice: '£14.99',
    pricingReviewStatus: 'NEEDS_REVIEW',
    saleFormat: 'BOTH',
    status: 'SUBMITTED',
    title: 'Winterreise highlights',
    tracks: [
      {
        composer: 'Franz Schubert',
        movementNo: 'No. 1',
        title: 'Gute Nacht',
        titleInWork: 'Opening song'
      }
    ]
  }

  assert.equal(collectionMatchesUploadInventorySearch({ collection, query: 'submitted' }), true)
  assert.equal(collectionMatchesUploadInventorySearch({ collection, query: 'gute nacht' }), true)
  assert.equal(collectionMatchesUploadInventorySearch({ collection, query: 'opera' }), false)
})

test('upload inventory filters preserve all rows when query is empty', () => {
  const tracks = [
    { title: 'Mozart Concerto' },
    { title: 'Brahms Sonata' }
  ]
  const collections = [
    { title: 'Opera scenes' },
    { title: 'Warmup pack' }
  ]

  assert.deepEqual(filterUploadInventoryTracks({ query: '', tracks }), tracks)
  assert.deepEqual(filterUploadInventoryCollections({ collections, query: '' }), collections)
  assert.deepEqual(filterUploadInventoryTracks({ query: 'brahms', tracks }), [{ title: 'Brahms Sonata' }])
  assert.deepEqual(filterUploadInventoryCollections({ collections, query: 'opera' }), [{ title: 'Opera scenes' }])
})
