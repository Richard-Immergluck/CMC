import assert from 'node:assert/strict'
import test from 'node:test'

process.env.DATABASE_URL ||= 'postgresql://postgres:postgres@localhost:5432/cmc_test'

const {
  toReleasePricingReviewItem,
  toRequestPricingReviewItem,
  toTrackPricingReviewItem
} = await import('../lib/server/admin-pricing-reviews.mjs')

test('admin pricing review serializers expose stable review context', () => {
  assert.deepEqual(
    toTrackPricingReviewItem({
      id: 10,
      title: 'Track title',
      composer: 'Composer',
      catalogueType: 'SINGLE_TRACK',
      saleFormat: 'INDIVIDUAL',
      pricePence: 599,
      pricingReviewStatus: 'NEEDS_REVIEW',
      pricingJustification: 'Specialist prep',
      uploadedAt: new Date('2026-07-01T10:00:00.000Z'),
      uploadedBy: {
        id: 'uploader-1',
        name: 'Uploader',
        email: 'uploader@example.com'
      }
    }).uploader,
    {
      id: 'uploader-1',
      name: 'Uploader',
      email: 'uploader@example.com'
    }
  )

  assert.deepEqual(
    toRequestPricingReviewItem({
      id: 20,
      requestId: 30,
      pricePence: 1499,
      currency: 'gbp',
      catalogueType: 'MOVEMENT',
      saleFormat: 'INDIVIDUAL',
      reviewStatus: 'NEEDS_REVIEW',
      requesterDecision: 'PENDING',
      justification: 'Longer custom cut',
      createdAt: new Date('2026-07-02T10:00:00.000Z'),
      proposedBy: null,
      request: null
    }).formattedPrice,
    '£14.99'
  )

  assert.deepEqual(
    toReleasePricingReviewItem({
      id: 40,
      title: 'Release title',
      composer: 'Mixed',
      catalogueType: 'COLLECTION',
      saleFormat: 'BOTH',
      pricePence: 2999,
      pricingReviewStatus: 'NEEDS_REVIEW',
      pricingJustification: 'Large collection',
      status: 'SUBMITTED',
      tracks: [
        {
          movementNo: 'I',
          position: 1,
          titleInWork: 'Opening cut',
          track: {
            id: 1,
            title: 'Original title one',
            composer: 'Track composer',
            fileName: 'should-not-leak.mp3'
          }
        },
        {
          movementNo: null,
          position: 2,
          titleInWork: null,
          track: {
            id: 2,
            title: 'Original title two',
            composer: 'Track composer'
          }
        }
      ],
      createdAt: new Date('2026-07-03T10:00:00.000Z'),
      uploadedBy: {
        id: 'uploader-2',
        name: 'Release uploader',
        email: 'release@example.com'
      }
    }),
    {
      id: 40,
      title: 'Release title',
      composer: 'Mixed',
      catalogueType: 'COLLECTION',
      saleFormat: 'BOTH',
      pricePence: 2999,
      formattedPrice: '£29.99',
      pricingReviewStatus: 'NEEDS_REVIEW',
      pricingJustification: 'Large collection',
      status: 'SUBMITTED',
      suggestedBand: 'Collection',
      tracks: [
        {
          id: 1,
          composer: 'Track composer',
          movementNo: 'I',
          position: 1,
          title: 'Opening cut',
          trackId: 1
        },
        {
          id: 2,
          composer: 'Track composer',
          movementNo: null,
          position: 2,
          title: 'Original title two',
          trackId: 2
        }
      ],
      trackCount: 2,
      createdAt: new Date('2026-07-03T10:00:00.000Z'),
      uploader: {
        id: 'uploader-2',
        name: 'Release uploader',
        email: 'release@example.com'
      }
    }
  )
})
