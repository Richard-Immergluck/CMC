import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getWorksCollectionBrowseCategory,
  maxWorksCollectionTags,
  worksCollectionBrowseCategories,
  worksCollectionTags,
  worksCollectionTagSlugs
} from '../lib/works-collection-tags.mjs'

test('controlled Works and Collections tags remain unique and within a compact selection limit', () => {
  assert.equal(maxWorksCollectionTags, 3)
  assert.equal(new Set(worksCollectionTagSlugs).size, worksCollectionTags.length)
  assert.ok(worksCollectionTags.every(tag => tag.label && tag.slug && tag.description))
})

test('browse categories map to a structural type or a controlled tag', () => {
  assert.ok(worksCollectionBrowseCategories.every(category => category.catalogueType || category.tagSlug))
  assert.equal(getWorksCollectionBrowseCategory('song-cycles')?.catalogueType, 'SONG_CYCLE')
  assert.equal(getWorksCollectionBrowseCategory('opera')?.tagSlug, 'opera')
  assert.equal(getWorksCollectionBrowseCategory('unknown'), null)
})
