import assert from 'node:assert/strict'
import test from 'node:test'
import {
  demoCatalogueFixtureMap,
  demoCatalogueTracks
} from '../lib/demo/catalogue-fixtures.mjs'

test('demo catalogue exposes 50 generated tracks for browsing tests', () => {
  assert.equal(demoCatalogueTracks.length, 50)
  assert.equal(Object.keys(demoCatalogueFixtureMap).length, 50)
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
