import assert from 'node:assert/strict'
import test from 'node:test'
import {
  collectionMatchesUploadInventorySearch,
  filterAndSortUploadInventoryCollections,
  filterAndSortUploadInventoryTracks,
  filterUploadInventoryCollections,
  filterUploadInventoryTracks,
  getUploadInventorySearchQuery,
  getUploadInventoryCollectionFilterCounts,
  getUploadInventoryTrackFilterCounts,
  isUploadInventoryTrackMetadataComplete,
  collectionMatchesUploadInventoryFilter,
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
    additionalInfo: 'Recorded for rehearsal with optional repeats.',
    composer: 'Franz Schubert',
    downloadName: 'schubert-lindenbaum-rehearsal.wav',
    formattedPrice: '£2.99',
    instrumentation: 'Piano, voice',
    key: 'E major',
    title: 'Lindenbaum rehearsal'
  }

  assert.equal(trackMatchesUploadInventorySearch({ query: 'schubert', track }), true)
  assert.equal(trackMatchesUploadInventorySearch({ query: 'winterreise', track }), true)
  assert.equal(trackMatchesUploadInventorySearch({ query: 'optional repeats', track }), true)
  assert.equal(trackMatchesUploadInventorySearch({ query: 'lindenbaum-rehearsal', track }), true)
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

test('upload inventory collection counts describe release lifecycle posture', () => {
  const collections = [
    {
      pricingReviewStatus: 'APPROVED',
      status: 'PUBLISHED',
      title: 'Live collection'
    },
    {
      pricingReviewStatus: 'NEEDS_REVIEW',
      status: 'SUBMITTED',
      title: 'Review collection'
    },
    {
      pricingReviewStatus: 'REJECTED',
      status: 'NEEDS_CHANGES',
      title: 'Needs changes collection'
    },
    {
      pricingReviewStatus: 'APPROVED',
      status: 'ARCHIVED',
      title: 'Archived collection'
    }
  ]

  assert.equal(collectionMatchesUploadInventoryFilter({ collection: collections[0], filter: 'live' }), true)
  assert.equal(collectionMatchesUploadInventoryFilter({ collection: collections[1], filter: 'review' }), true)
  assert.equal(collectionMatchesUploadInventoryFilter({ collection: collections[2], filter: 'needsChanges' }), true)
  assert.equal(collectionMatchesUploadInventoryFilter({ collection: collections[3], filter: 'archived' }), true)
  assert.deepEqual(getUploadInventoryCollectionFilterCounts(collections), {
    all: 4,
    archived: 1,
    live: 1,
    needsChanges: 1,
    review: 1
  })
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

test('upload inventory track counts describe metadata collection and activity posture', () => {
  const tracks = [
    {
      collectionMemberships: [{ collectionTitle: 'Winterreise' }],
      commentCount: 2,
      composer: 'Franz Schubert',
      instrumentation: 'Piano, voice',
      key: 'E minor',
      requestCount: 0,
      title: 'Gute Nacht'
    },
    {
      collectionMemberships: [],
      commentCount: 0,
      composer: '',
      instrumentation: 'Piano',
      key: 'C major',
      requestCount: 1,
      title: 'Warmup study'
    }
  ]

  assert.equal(isUploadInventoryTrackMetadataComplete(tracks[0]), true)
  assert.equal(isUploadInventoryTrackMetadataComplete(tracks[1]), false)
  assert.deepEqual(getUploadInventoryTrackFilterCounts(tracks), {
    all: 2,
    complete: 1,
    incomplete: 1,
    inCollection: 1,
    needsCollection: 1,
    withActivity: 2
  })
})

test('upload inventory track filter and sort supports large-library management views', () => {
  const tracks = [
    {
      collectionMemberships: [],
      commentCount: 0,
      composer: 'Ludwig van Beethoven',
      instrumentation: 'Piano',
      key: 'C minor',
      requestCount: 0,
      title: 'Moonlight excerpt',
      uploadedAtSort: 100
    },
    {
      collectionMemberships: [{ collectionTitle: 'Opera scenes' }],
      commentCount: 4,
      composer: 'Wolfgang Amadeus Mozart',
      instrumentation: 'Piano, voice',
      key: 'D major',
      requestCount: 2,
      title: 'Catalogue aria',
      uploadedAtSort: 200
    },
    {
      collectionMemberships: [],
      commentCount: 1,
      composer: '',
      instrumentation: '',
      key: '',
      requestCount: 0,
      title: 'Untitled upload',
      uploadedAtSort: 300
    }
  ]

  assert.deepEqual(
    filterAndSortUploadInventoryTracks({
      filter: 'needsCollection',
      query: '',
      sort: 'title',
      tracks
    }).map(track => track.title),
    ['Moonlight excerpt', 'Untitled upload']
  )

  assert.deepEqual(
    filterAndSortUploadInventoryTracks({
      filter: 'withActivity',
      query: '',
      sort: 'activity',
      tracks
    }).map(track => track.title),
    ['Catalogue aria', 'Untitled upload']
  )

  assert.deepEqual(
    filterAndSortUploadInventoryTracks({
      filter: 'all',
      query: 'mozart',
      sort: 'newest',
      tracks
    }).map(track => track.title),
    ['Catalogue aria']
  )
})

test('upload inventory collection filter and sort supports release maintenance views', () => {
  const collections = [
    {
      createdAtSort: 200,
      pricePence: 1499,
      pricingReviewStatus: 'APPROVED',
      status: 'PUBLISHED',
      title: 'Winterreise highlights',
      tracks: [{ title: 'Gute Nacht' }, { title: 'Der Lindenbaum' }]
    },
    {
      createdAtSort: 300,
      pricePence: 2999,
      pricingReviewStatus: 'NEEDS_REVIEW',
      status: 'SUBMITTED',
      title: 'Opera scenes',
      tracks: [{ title: 'Aria cut' }, { title: 'Recitative' }, { title: 'Finale' }]
    },
    {
      createdAtSort: 100,
      pricePence: 999,
      pricingReviewStatus: 'REJECTED',
      status: 'NEEDS_CHANGES',
      title: 'Learning pack',
      tracks: [{ title: 'Slow practice' }]
    }
  ]

  assert.deepEqual(
    filterAndSortUploadInventoryCollections({
      collections,
      filter: 'review',
      query: '',
      sort: 'newest'
    }).map(collection => collection.title),
    ['Opera scenes']
  )

  assert.deepEqual(
    filterAndSortUploadInventoryCollections({
      collections,
      filter: 'all',
      query: '',
      sort: 'trackCount'
    }).map(collection => collection.title),
    ['Opera scenes', 'Winterreise highlights', 'Learning pack']
  )

  assert.deepEqual(
    filterAndSortUploadInventoryCollections({
      collections,
      filter: 'all',
      query: 'winterreise',
      sort: 'price'
    }).map(collection => collection.title),
    ['Winterreise highlights']
  )
})
