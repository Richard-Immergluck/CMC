import assert from 'node:assert/strict'
import test from 'node:test'
import {
  adminUserUpdateBodySchema,
  adminTrackModerationBodySchema,
  checkoutSessionBodySchema,
  createTrackBodySchema,
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

test('signed track URL query accepts review mode', () => {
  assert.deepEqual(validateInput(signedTrackUrlQuerySchema, { trackId: '7', mode: 'review' }), {
    mode: 'review',
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

test('admin user update body accepts only role and status fields', () => {
  assert.deepEqual(
    validateInput(adminUserUpdateBodySchema, {
      role: 'UPLOADER',
      accountStatus: 'ACTIVE',
      uploaderStatus: 'APPROVED',
      ignored: 'removed'
    }),
    {
      role: 'UPLOADER',
      accountStatus: 'ACTIVE',
      uploaderStatus: 'APPROVED'
    }
  )

  assert.throws(
    () => validateInput(adminUserUpdateBodySchema, {}),
    error => error.statusCode === 400
  )

  assert.throws(
    () => validateInput(adminUserUpdateBodySchema, { role: 'OWNER' }),
    error => error.statusCode === 400
  )
})

test('admin track moderation body accepts supported decisions', () => {
  assert.deepEqual(
    validateInput(adminTrackModerationBodySchema, {
      decision: 'approve',
      moderationNotes: ' Ready for catalogue '
    }),
    {
      decision: 'approve',
      moderationNotes: 'Ready for catalogue'
    }
  )

  assert.throws(
    () => validateInput(adminTrackModerationBodySchema, { decision: 'publish' }),
    error => error.statusCode === 400
  )
})

test('track creation body normalizes upload metadata and preview bounds', () => {
  assert.deepEqual(
    validateInput(createTrackBodySchema, {
      title: ' Bach Study ',
      composer: 'Synthetic Composer',
      key: 'D minor',
      instrumentation: 'Piano',
      newFileName: 'development/upload-id.mp3',
      previewStart: '10',
      previewEnd: '25',
      durationSeconds: '180',
      sourceContentType: ' audio/mpeg ',
      additionalInfo: 'Practice backing track',
      price: '2.99',
      currency: 'GBP'
    }),
    {
      title: 'Bach Study',
      composer: 'Synthetic Composer',
      key: 'D minor',
      instrumentation: 'Piano',
      newFileName: 'development/upload-id.mp3',
      previewStart: 10,
      previewEnd: 25,
      durationSeconds: 180,
      sourceContentType: 'audio/mpeg',
      additionalInfo: 'Practice backing track',
      price: 2.99,
      currency: 'gbp',
      downloadCount: 0
    }
  )

  assert.throws(
    () => validateInput(createTrackBodySchema, {
      title: 'Bach Study',
      composer: 'Synthetic Composer',
      key: 'D minor',
      instrumentation: 'Piano',
      newFileName: 'development/upload-id.mp3',
      previewStart: '30',
      previewEnd: '10',
      additionalInfo: 'Practice backing track',
      price: '2.99'
    }),
    error => error.statusCode === 400
  )
})
