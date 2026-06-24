import assert from 'node:assert/strict'
import test from 'node:test'
import {
  checkoutSessionBodySchema,
  signedTrackUrlQuerySchema,
  trackIdParamSchema,
  uploadSignedUrlBodySchema,
  validateInput
} from '../lib/validation/api.mjs'

test('track id params parse positive integer strings', () => {
  assert.deepEqual(validateInput(trackIdParamSchema, { trackId: '42' }), {
    trackId: 42
  })
})

test('track id params reject non-integer and array input', () => {
  assert.throws(
    () => validateInput(trackIdParamSchema, { trackId: '4.2' }),
    error => error.statusCode === 400
  )

  assert.throws(
    () => validateInput(trackIdParamSchema, { trackId: ['1', '2'] }),
    error => error.statusCode === 400
  )
})

test('signed track URL query defaults to sample mode', () => {
  assert.deepEqual(validateInput(signedTrackUrlQuerySchema, { trackId: '7' }), {
    mode: 'sample',
    trackId: 7
  })
})

test('signed track URL query rejects unsupported modes', () => {
  assert.throws(
    () => validateInput(signedTrackUrlQuerySchema, { trackId: '7', mode: 'admin' }),
    error => error.statusCode === 400
  )
})

test('upload signing body accepts only mp3 file metadata', () => {
  assert.deepEqual(
    validateInput(uploadSignedUrlBodySchema, {
      fileName: 'bach-study.mp3',
      contentType: 'audio/mpeg'
    }),
    {
      fileName: 'bach-study.mp3',
      contentType: 'audio/mpeg'
    }
  )

  assert.throws(
    () => validateInput(uploadSignedUrlBodySchema, {
      fileName: '../bach-study.wav',
      contentType: 'audio/wav'
    }),
    error => error.statusCode === 400
  )
})

test('checkout body requires a bounded list of positive track ids', () => {
  assert.deepEqual(validateInput(checkoutSessionBodySchema, { trackIds: ['1', 2] }), {
    trackIds: [1, 2]
  })

  assert.throws(
    () => validateInput(checkoutSessionBodySchema, { trackIds: [] }),
    error => error.statusCode === 400
  )
})

