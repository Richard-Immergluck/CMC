import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createUploadObjectKey,
  getExtension,
  normalizeS3Prefix
} from '../lib/server/uploads.mjs'

test('normalizeS3Prefix accepts empty and slash-padded prefixes', () => {
  assert.equal(normalizeS3Prefix(), '')
  assert.equal(normalizeS3Prefix('development'), 'development/')
  assert.equal(normalizeS3Prefix('/development//'), 'development/')
})

test('getExtension returns lowercase extension', () => {
  assert.equal(getExtension('Bach-Study.MP3'), 'mp3')
})

test('createUploadObjectKey uses prefix, supplied id, and original extension', () => {
  assert.equal(
    createUploadObjectKey({
      fileName: 'bach-study.mp3',
      keyPrefix: 'development/',
      id: 'fixed-id'
    }),
    'development/fixed-id.mp3'
  )
})

