import assert from 'node:assert/strict'
import test from 'node:test'
import { sanitizeAttachmentFileName } from '../lib/server/s3.js'

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
