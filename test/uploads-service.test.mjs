import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createUploadObjectKey,
  getExtension,
  normalizeS3Prefix,
  normalizeUploadUserSegment
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
      userId: 'user-123',
      id: 'fixed-id'
    }),
    'development/uploads/user-123/fixed-id.mp3'
  )
})

test('createUploadObjectKey scopes unusual user ids to safe path segments', () => {
  assert.equal(
    createUploadObjectKey({
      fileName: 'bach-study.MP3',
      keyPrefix: '/development//',
      userId: ' user/email@example.com ',
      id: 'fixed-id'
    }),
    'development/uploads/user_email_example_com/fixed-id.mp3'
  )
})

test('normalizeUploadUserSegment rejects missing users', () => {
  assert.throws(
    () => normalizeUploadUserSegment(''),
    /user id is required/
  )
})
