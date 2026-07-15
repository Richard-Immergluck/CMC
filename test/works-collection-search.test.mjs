import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createWorksCollectionHref,
  defaultWorksPageSize,
  maxWorksPageSize,
  parseWorksCollectionQuery
} from '../lib/works-collection-search.mjs'

test('Works and Collections query parsing applies archive defaults', () => {
  assert.deepEqual(parseWorksCollectionQuery({}), {
    catalogueType: '',
    category: '',
    composer: '',
    page: 1,
    pageSize: defaultWorksPageSize,
    q: '',
    sort: 'title'
  })
})

test('Works and Collections query parsing bounds and validates filters', () => {
  assert.deepEqual(parseWorksCollectionQuery({
    catalogueType: 'SONG_CYCLE',
    category: 'lieder',
    composer: ' Franz Schubert ',
    page: '4',
    pageSize: '1000',
    q: ' Winterreise ',
    sort: 'newest'
  }), {
    catalogueType: 'SONG_CYCLE',
    category: 'lieder',
    composer: 'Franz Schubert',
    page: 4,
    pageSize: maxWorksPageSize,
    q: 'Winterreise',
    sort: 'newest'
  })

  assert.deepEqual(parseWorksCollectionQuery({
    catalogueType: 'NOT_A_TYPE',
    category: 'not-a-category',
    page: '-5',
    sort: 'not-a-sort'
  }), {
    catalogueType: '',
    category: '',
    composer: '',
    page: 1,
    pageSize: defaultWorksPageSize,
    q: '',
    sort: 'title'
  })
})

test('Works and Collections links preserve filters while replacing the page', () => {
  const href = createWorksCollectionHref({
    page: 3,
    query: parseWorksCollectionQuery({
      category: 'opera',
      pageSize: 50,
      q: 'Mozart'
    })
  })

  const url = new URL(href, 'https://cmc.test')

  assert.equal(url.pathname, '/works-collections')
  assert.equal(url.searchParams.get('q'), 'Mozart')
  assert.equal(url.searchParams.get('category'), 'opera')
  assert.equal(url.searchParams.get('pageSize'), '50')
  assert.equal(url.searchParams.get('page'), '3')
})
