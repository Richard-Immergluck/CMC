import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createDownloadName,
  normalizeTrackPrice,
  toTrackCreateData
} from '../lib/server/tracks-core.mjs'

const user = {
  id: 'user-1'
}

const input = {
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
  currency: 'gbp'
}

const now = new Date('2026-06-25T12:30:00.000Z')

test('normalizeTrackPrice derives minor units from decimal price', () => {
  assert.deepEqual(normalizeTrackPrice({ price: 2.99 }), {
    price: 2.99,
    pricePence: 299
  })
})

test('normalizeTrackPrice preserves explicit integer minor units', () => {
  assert.deepEqual(normalizeTrackPrice({ price: 2.99, pricePence: 300 }), {
    price: 2.99,
    pricePence: 300
  })
})

test('createDownloadName uses fallback when provided', () => {
  assert.equal(
    createDownloadName({
      title: 'Ignored',
      composer: 'Ignored',
      fallback: 'custom.mp3'
    }),
    'custom.mp3'
  )
})

test('toTrackCreateData maps upload input into Prisma create data', () => {
  assert.deepEqual(toTrackCreateData({ input, user, now }), {
    fileName: 'development/upload-id.mp3',
    title: 'Bach Study',
    composer: 'Synthetic Composer',
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    processingStatus: 'READY',
    publishedAt: now,
    reviewedAt: now,
    key: 'D minor',
    instrumentation: 'Piano',
    durationSeconds: 180,
    sourceContentType: 'audio/mpeg',
    uploadedBy: {
      connect: {
        id: 'user-1'
      }
    },
    previewStart: 10,
    previewEnd: 25,
    additionalInfo: 'Practice backing track',
    price: 2.99,
    pricePence: 299,
    currency: 'gbp',
    formattedPrice: 'GBP 2.99',
    downloadName: 'Bach Study_Synthetic Composer.mp3',
    downloadCount: 0
  })
})
