import assert from 'node:assert/strict'
import test from 'node:test'
import {
  demoCatalogueFixtureMap,
  demoCatalogueTracks
} from '../lib/demo/catalogue-fixtures.mjs'
import {
  getDemoFixtureBuffer,
  getDemoFixtureName
} from '../lib/server/demo-fixtures.js'

test('demo catalogue exposes 100 generated tracks for browsing tests', () => {
  assert.equal(demoCatalogueTracks.length, 100)
  assert.equal(Object.keys(demoCatalogueFixtureMap).length, 100)
})

test('demo catalogue tracks have stable marketplace metadata', () => {
  for (const track of demoCatalogueTracks) {
    assert.ok(track.slug)
    assert.ok(track.title)
    assert.ok(track.composer)
    assert.ok(track.key)
    assert.ok(track.instrumentation)
    assert.equal(Number.isInteger(track.pricePence), true)
    assert.match(track.formattedPrice, /^GBP \d+\.\d{2}$/)
  }
})

test('demo fixture resolver accepts demo and e2e fixture prefixes', () => {
  assert.equal(getDemoFixtureName('demo-fixtures/bach-style-warmup.wav'), 'bach-style-warmup.wav')
  assert.equal(getDemoFixtureName('e2e-fixtures/catalogue-navigation.wav'), 'catalogue-navigation.wav')
  assert.equal(getDemoFixtureName('uploads/user/audio.wav'), null)
})

test('catalogue navigation e2e fixture generates playable wav audio', () => {
  const buffer = getDemoFixtureBuffer('catalogue-navigation.wav')

  assert.ok(buffer)
  assert.equal(buffer.subarray(0, 4).toString('ascii'), 'RIFF')
  assert.equal(buffer.subarray(8, 12).toString('ascii'), 'WAVE')
})
