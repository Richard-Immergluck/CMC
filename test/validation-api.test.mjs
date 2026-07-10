import assert from 'node:assert/strict'
import test from 'node:test'
import {
  adminOperationsQuerySchema,
  adminSecurityReportQuerySchema,
  adminUserAccessReviewBodySchema,
  adminUserUpdateBodySchema,
  adminTrackModerationBodySchema,
  adminPricingReviewBodySchema,
  checkoutSessionBodySchema,
  createTrackBodySchema,
  createWorksCollectionBodySchema,
  profileCommentBodySchema,
  positiveIntegerParamSchema,
  reconcileCheckoutSessionBodySchema,
  simulatedCartBodySchema,
  signedTrackUrlQuerySchema,
  trackRequestBodySchema,
  trackRequestPricingProposalBodySchema,
  trackRequestStatusBodySchema,
  trackIdParamSchema,
  updateWorksCollectionBodySchema,
  uploadSignedUrlBodySchema,
  validateInput,
  worksCollectionIdParamSchema
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

test('positive integer params parse generic ids', () => {
  assert.deepEqual(validateInput(positiveIntegerParamSchema, { id: '12' }), {
    id: 12
  })

  assert.throws(
    () => validateInput(positiveIntegerParamSchema, { id: '0' }),
    error => error.statusCode === 400
  )
})

test('works collection id params parse positive integer strings', () => {
  assert.deepEqual(validateInput(worksCollectionIdParamSchema, { collectionId: '42' }), {
    collectionId: 42
  })

  assert.throws(
    () => validateInput(worksCollectionIdParamSchema, { collectionId: 'nope' }),
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

test('checkout body requires a bounded list of positive track or release ids', () => {
  assert.deepEqual(validateInput(checkoutSessionBodySchema, { trackIds: ['1', 2] }), {
    releaseIds: [],
    trackIds: [1, 2]
  })

  assert.deepEqual(validateInput(checkoutSessionBodySchema, { releaseIds: ['3'] }), {
    releaseIds: [3],
    trackIds: []
  })

  assert.throws(
    () => validateInput(checkoutSessionBodySchema, { trackIds: [] }),
    error => error.statusCode === 400
  )
})

test('simulated cart body accepts only a bounded list of track ids', () => {
  assert.deepEqual(
    validateInput(simulatedCartBodySchema, {
      tracks: [{ id: '1', title: 'ignored' }, { id: 2 }]
    }),
    {
      tracks: [{ id: 1 }, { id: 2 }]
    }
  )

  assert.throws(
    () => validateInput(simulatedCartBodySchema, { tracks: [] }),
    error => error.statusCode === 400
  )

  assert.throws(
    () => validateInput(simulatedCartBodySchema, { tracks: [{ id: 'abc' }] }),
    error => error.statusCode === 400
  )
})

test('checkout reconciliation body requires checkout session ids', () => {
  assert.deepEqual(
    validateInput(reconcileCheckoutSessionBodySchema, {
      sessionId: 'cs_test_123'
    }),
    {
      sessionId: 'cs_test_123'
    }
  )

  assert.throws(
    () => validateInput(reconcileCheckoutSessionBodySchema, {}),
    error => error.statusCode === 400
  )

  assert.throws(
    () => validateInput(reconcileCheckoutSessionBodySchema, {
      sessionId: 'pi_test_123'
    }),
    error => error.statusCode === 400
  )
})

test('profile comment body requires an owned track id and bounded comment', () => {
  assert.deepEqual(
    validateInput(profileCommentBodySchema, {
      trackId: '12',
      comment: ' Useful practice track '
    }),
    {
      trackId: 12,
      comment: 'Useful practice track'
    }
  )

  assert.throws(
    () => validateInput(profileCommentBodySchema, {
      trackId: 'abc',
      comment: 'Nice'
    }),
    error => error.statusCode === 400
  )

  assert.throws(
    () => validateInput(profileCommentBodySchema, {
      trackId: '12',
      comment: ''
    }),
    error => error.statusCode === 400
  )
})

test('track request body requires a public track id and bounded request fields', () => {
  assert.deepEqual(
    validateInput(trackRequestBodySchema, {
      trackId: '12',
      title: ' Slower practice tempo ',
      notes: ' Could this be available at crotchet = 72? ',
      ignored: 'removed'
    }),
    {
      trackId: 12,
      title: 'Slower practice tempo',
      notes: 'Could this be available at crotchet = 72?'
    }
  )

  assert.throws(
    () => validateInput(trackRequestBodySchema, {
      trackId: 'abc',
      title: 'Slower practice tempo'
    }),
    error => error.statusCode === 400
  )

  assert.throws(
    () => validateInput(trackRequestBodySchema, {
      trackId: '12',
      title: ''
    }),
    error => error.statusCode === 400
  )
})

test('track request status body accepts only supported workflow states', () => {
  assert.deepEqual(
    validateInput(trackRequestStatusBodySchema, {
      rejectionNote: 'Not in the current catalogue plan.',
      rejectionReason: 'outside_catalogue_plans',
      status: 'REJECTED',
      ignored: 'removed'
    }),
    {
      rejectionNote: 'Not in the current catalogue plan.',
      rejectionReason: 'outside_catalogue_plans',
      status: 'REJECTED'
    }
  )

  assert.deepEqual(
    validateInput(trackRequestStatusBodySchema, {
      status: 'COMPLETED'
    }),
    {
      status: 'COMPLETED'
    }
  )

  assert.throws(
    () => validateInput(trackRequestStatusBodySchema, { status: 'DONE' }),
    error => error.statusCode === 400
  )

  assert.throws(
    () => validateInput(trackRequestStatusBodySchema, {}),
    error => error.statusCode === 400
  )
})

test('track request pricing proposal body accepts guided catalogue prices only', () => {
  assert.deepEqual(
    validateInput(trackRequestPricingProposalBodySchema, {
      catalogueType: 'OPERA_EXCERPT',
      saleFormat: 'INDIVIDUAL',
      pricePence: '699',
      currency: 'GBP',
      justification: ' Prepared to order with specialist cuts. ',
      ignored: 'removed'
    }),
    {
      catalogueType: 'OPERA_EXCERPT',
      saleFormat: 'INDIVIDUAL',
      pricePence: 699,
      currency: 'gbp',
      justification: 'Prepared to order with specialist cuts.'
    }
  )

  assert.throws(
    () => validateInput(trackRequestPricingProposalBodySchema, {
      catalogueType: 'SINGLE_TRACK',
      saleFormat: 'INDIVIDUAL',
      pricePence: 999
    }),
    error => error.statusCode === 400
  )

  assert.throws(
    () => validateInput(trackRequestPricingProposalBodySchema, {
      catalogueType: 'MADE_UP_TYPE',
      saleFormat: 'INDIVIDUAL',
      pricePence: 299
    }),
    error => error.statusCode === 400
  )

  assert.throws(
    () => validateInput(trackRequestPricingProposalBodySchema, {
      catalogueType: 'SONG_CYCLE',
      saleFormat: 'INDIVIDUAL',
      pricePence: 1499
    }),
    error => error.statusCode === 400
  )
})

test('admin user update body accepts only role and status fields', () => {
  assert.deepEqual(
    validateInput(adminUserUpdateBodySchema, {
      role: 'UPLOADER',
      accountStatus: 'ACTIVE',
      uploaderStatus: 'APPROVED',
      reason: ' Operational cover ',
      ignored: 'removed'
    }),
    {
      role: 'UPLOADER',
      accountStatus: 'ACTIVE',
      uploaderStatus: 'APPROVED',
      reason: 'Operational cover'
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

test('admin user access review body accepts approve or reject decisions', () => {
  assert.deepEqual(
    validateInput(adminUserAccessReviewBodySchema, {
      decision: 'approve',
      reviewNote: ' Approved after ticket review '
    }),
    {
      decision: 'approve',
      reviewNote: 'Approved after ticket review'
    }
  )

  assert.throws(
    () => validateInput(adminUserAccessReviewBodySchema, { decision: 'defer' }),
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

test('admin pricing review body accepts only supported targets and decisions', () => {
  assert.deepEqual(
    validateInput(adminPricingReviewBodySchema, {
      decision: 'approve',
      note: ' Fair specialist price ',
      targetId: '42',
      targetType: 'requestProposal',
      ignored: 'removed'
    }),
    {
      decision: 'approve',
      note: 'Fair specialist price',
      targetId: 42,
      targetType: 'requestProposal'
    }
  )

  assert.throws(
    () => validateInput(adminPricingReviewBodySchema, {
      decision: 'archive',
      targetId: 42,
      targetType: 'track'
    }),
    error => error.statusCode === 400
  )

  assert.throws(
    () => validateInput(adminPricingReviewBodySchema, {
      decision: 'approve',
      targetId: 42,
      targetType: 'release'
    }),
    error => error.statusCode === 400
  )
})

test('admin operations query accepts bounded audit filters', () => {
  assert.deepEqual(
    validateInput(adminOperationsQuerySchema, {
      action: ' track_access.denied ',
      auditCategory: 'accountLifecycle',
      actorId: 'user-1',
      entityType: 'Track',
      entityId: '42',
      createdFrom: '2026-06-01T00:00:00.000Z',
      createdTo: '2026-06-30T23:59:59.000Z',
      limit: '50'
    }),
    {
      action: 'track_access.denied',
      auditCategory: 'accountLifecycle',
      actorId: 'user-1',
      entityType: 'Track',
      entityId: '42',
      createdFrom: new Date('2026-06-01T00:00:00.000Z'),
      createdTo: new Date('2026-06-30T23:59:59.000Z'),
      limit: 50
    }
  )
})

test('admin operations query rejects unbounded or invalid filters', () => {
  assert.throws(
    () => validateInput(adminOperationsQuerySchema, { limit: '101' }),
    error => error.statusCode === 400
  )

  assert.throws(
    () => validateInput(adminOperationsQuerySchema, { createdFrom: 'not-a-date' }),
    error => error.statusCode === 400
  )

  assert.throws(
    () => validateInput(adminOperationsQuerySchema, { auditCategory: 'payments' }),
    error => error.statusCode === 400
  )
})

test('admin security report query accepts json and csv formats only', () => {
  assert.deepEqual(validateInput(adminSecurityReportQuerySchema, {}), {
    format: 'json'
  })
  assert.deepEqual(validateInput(adminSecurityReportQuerySchema, { format: 'csv' }), {
    format: 'csv'
  })
  assert.throws(
    () => validateInput(adminSecurityReportQuerySchema, { format: 'xml' }),
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
      currency: 'GBP',
      catalogueType: 'SINGLE_TRACK',
      saleFormat: 'INDIVIDUAL',
      fulfilledRequestId: '42'
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
      catalogueType: 'SINGLE_TRACK',
      saleFormat: 'INDIVIDUAL',
      fulfilledRequestId: 42,
      downloadCount: 0
    }
  )

  assert.deepEqual(
    validateInput(createTrackBodySchema, {
      title: ' Opera Scene ',
      composer: 'Synthetic Composer',
      key: 'D minor',
      instrumentation: 'Piano',
      newFileName: 'development/opera-scene.mp3',
      previewStart: '0',
      previewEnd: '15',
      durationSeconds: '420',
      sourceContentType: 'audio/mpeg',
      additionalInfo: 'Specialist opera excerpt',
      price: '8.99',
      pricePence: '899',
      currency: 'GBP',
      catalogueType: 'OPERA_EXCERPT',
      saleFormat: 'INDIVIDUAL',
      pricingJustification: 'Long specialist excerpt'
    }),
    {
      title: 'Opera Scene',
      composer: 'Synthetic Composer',
      key: 'D minor',
      instrumentation: 'Piano',
      newFileName: 'development/opera-scene.mp3',
      previewStart: 0,
      previewEnd: 15,
      durationSeconds: 420,
      sourceContentType: 'audio/mpeg',
      additionalInfo: 'Specialist opera excerpt',
      price: 8.99,
      pricePence: 899,
      currency: 'gbp',
      catalogueType: 'OPERA_EXCERPT',
      saleFormat: 'INDIVIDUAL',
      pricingJustification: 'Long specialist excerpt',
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
      previewStart: '10',
      previewEnd: '25',
      additionalInfo: 'Practice backing track',
      price: '5.99',
      pricePence: '599',
      catalogueType: 'SINGLE_TRACK',
      saleFormat: 'INDIVIDUAL'
    }),
    error => error.statusCode === 400
  )

  assert.throws(
    () => validateInput(createTrackBodySchema, {
      title: 'Grouped Schubert Songs',
      composer: 'Synthetic Composer',
      key: 'Mixed',
      instrumentation: 'Piano',
      newFileName: 'development/grouped-schubert.mp3',
      previewStart: '10',
      previewEnd: '25',
      additionalInfo: 'This must be assembled later as a Work or Collection.',
      price: '14.99',
      pricePence: '1499',
      catalogueType: 'SONG_CYCLE',
      saleFormat: 'INDIVIDUAL'
    }),
    error => error.statusCode === 400
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

test('works collection body accepts guided grouped prices only', () => {
  assert.deepEqual(
    validateInput(createWorksCollectionBodySchema, {
      catalogueType: 'COLLECTION',
      composer: ' Synthetic Composer ',
      currency: 'GBP',
      pricePence: '1499',
      pricingJustification: ' Curated rehearsal set. ',
      saleFormat: 'BOTH',
      title: ' Grouped Rehearsal Set ',
      trackIds: ['11', '12'],
      ignored: 'removed'
    }),
    {
      catalogueType: 'COLLECTION',
      composer: 'Synthetic Composer',
      currency: 'gbp',
      pricePence: 1499,
      pricingJustification: 'Curated rehearsal set.',
      saleFormat: 'BOTH',
      title: 'Grouped Rehearsal Set',
      trackIds: [11, 12]
    }
  )

  assert.throws(
    () => validateInput(createWorksCollectionBodySchema, {
      catalogueType: 'SINGLE_TRACK',
      pricePence: 299,
      saleFormat: 'BOTH',
      title: 'Invalid grouped single',
      trackIds: [11, 12]
    }),
    error => error.statusCode === 400
  )

  assert.throws(
    () => validateInput(createWorksCollectionBodySchema, {
      catalogueType: 'COLLECTION',
      pricePence: 1499,
      saleFormat: 'BOTH',
      title: 'One track is not a collection',
      trackIds: [11]
    }),
    error => error.statusCode === 400
  )

  assert.throws(
    () => validateInput(createWorksCollectionBodySchema, {
      catalogueType: 'COLLECTION',
      pricePence: 5999,
      saleFormat: 'BOTH',
      title: 'Unguided price',
      trackIds: [11, 12]
    }),
    error => error.statusCode === 400
  )

  assert.deepEqual(
    validateInput(updateWorksCollectionBodySchema, {
      catalogueType: 'SONG_CYCLE',
      currency: 'GBP',
      pricePence: '1999',
      saleFormat: 'BUNDLE',
      title: 'Updated song cycle',
      trackIds: ['12', '11']
    }),
    {
      catalogueType: 'SONG_CYCLE',
      currency: 'gbp',
      pricePence: 1999,
      saleFormat: 'BUNDLE',
      title: 'Updated song cycle',
      trackIds: [12, 11]
    }
  )
})
