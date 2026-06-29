import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getSignedTrackUrl,
  sanitizeAttachmentFileName,
  signedUrlExpirySeconds
} from '../lib/server/s3.js'

test('attachment filenames remove header-breaking characters', () => {
  assert.equal(
    sanitizeAttachmentFileName('Bach"\r\nContent-Type:text/html.mp3'),
    'BachContent-Type_text-html.mp3'
  )
})

test('attachment filenames neutralize path separators', () => {
  assert.equal(
    sanitizeAttachmentFileName('../secret\\track.mp3'),
    '..-secret-track.mp3'
  )
})

test('attachment filenames are bounded and fall back when empty', () => {
  assert.equal(sanitizeAttachmentFileName('"\n\r'), 'track.mp3')
  assert.equal(sanitizeAttachmentFileName(null), 'track.mp3')
  assert.equal(sanitizeAttachmentFileName('x'.repeat(200)).length, 120)
})

test('signed URL expiry policy keeps short-lived access windows', () => {
  assert.deepEqual(signedUrlExpirySeconds, {
    sample: 60,
    full: 300,
    review: 300,
    download: 900,
    upload: 900
  })
})

test('signed URL generation rejects overly long expiries before reaching AWS', () => {
  assert.throws(
    () => getSignedTrackUrl({
      key: 'development/uploads/user-id/track.mp3',
      expires: signedUrlExpirySeconds.download + 1
    }),
    /Signed URL expiry must be between 1 and 900 seconds/
  )
})
