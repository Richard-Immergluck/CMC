import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  pocCatalogueTracks,
  pocReleaseDefinitions
} from '../lib/demo/poc-catalogue-fixtures.mjs'
import { auditActions } from '../lib/server/audit-core.mjs'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to seed PoC data')
}

if (process.env.VERCEL_ENV === 'production' && process.env.CMC_ALLOW_PRODUCTION_SEED !== 'true') {
  throw new Error('Refusing to seed production without CMC_ALLOW_PRODUCTION_SEED=true')
}

if (process.env.CMC_ALLOW_POC_RESEED !== 'true') {
  throw new Error('Refusing to reseed PoC data without CMC_ALLOW_POC_RESEED=true')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL
  })
})

const baseDate = new Date('2026-07-13T09:00:00.000Z')
const dayMs = 24 * 60 * 60 * 1000

const daysAgo = (days, hour = 9) => {
  const date = new Date(baseDate.getTime() - days * dayMs)
  date.setUTCHours(hour, 0, 0, 0)
  return date
}

const formatPrice = pricePence => `£${(pricePence / 100).toFixed(2)}`

const seedUsers = [
  {
    key: 'mainUploader',
    email: 'e2e-uploader@example.com',
    name: 'Clare Rhodes',
    role: 'UPLOADER',
    uploaderStatus: 'APPROVED'
  },
  {
    key: 'peerUploader',
    email: 'e2e-peer-uploader@example.com',
    name: 'Nadia Clarke',
    role: 'UPLOADER',
    uploaderStatus: 'APPROVED'
  },
  {
    key: 'uploaderTenor',
    email: 'martin-vale-uploader@example.com',
    name: 'Martin Vale',
    role: 'UPLOADER',
    uploaderStatus: 'APPROVED'
  },
  {
    key: 'uploaderCoach',
    email: 'isabel-march-uploader@example.com',
    name: 'Isabel March',
    role: 'UPLOADER',
    uploaderStatus: 'APPROVED'
  },
  {
    key: 'customer',
    email: 'e2e-customer@example.com',
    name: 'Amelia Hart',
    role: 'CUSTOMER',
    uploaderStatus: 'NOT_REQUESTED'
  },
  {
    key: 'customerBaritone',
    email: 'james-locke-customer@example.com',
    name: 'James Locke',
    role: 'CUSTOMER',
    uploaderStatus: 'NOT_REQUESTED'
  },
  {
    key: 'customerPianist',
    email: 'maria-fenwick-customer@example.com',
    name: 'Maria Fenwick',
    role: 'CUSTOMER',
    uploaderStatus: 'NOT_REQUESTED'
  },
  {
    key: 'customerStudent',
    email: 'priya-mason-customer@example.com',
    name: 'Priya Mason',
    role: 'CUSTOMER',
    uploaderStatus: 'NOT_REQUESTED'
  },
  {
    key: 'customerConductor',
    email: 'theo-harding-customer@example.com',
    name: 'Theo Harding',
    role: 'CUSTOMER',
    uploaderStatus: 'NOT_REQUESTED'
  },
  {
    key: 'admin',
    email: 'e2e-admin@example.com',
    name: 'Eleanor Shaw',
    role: 'ADMIN',
    uploaderStatus: 'APPROVED'
  },
  {
    key: 'support',
    email: 'e2e-support@example.com',
    name: 'Marcus Vale',
    role: 'SUPPORT',
    uploaderStatus: 'NOT_REQUESTED'
  },
  {
    key: 'pendingUploader',
    email: 'olivia-reed-pending@example.com',
    name: 'Olivia Reed',
    role: 'CUSTOMER',
    uploaderStatus: 'PENDING'
  },
  {
    key: 'suspendedCustomer',
    email: 'closed-archive-user@example.com',
    name: 'Archive User',
    role: 'CUSTOMER',
    uploaderStatus: 'NOT_REQUESTED',
    accountStatus: 'SUSPENDED'
  }
]

const batchDefinitions = [
  {
    key: 'song-cycles-complete',
    label: 'March song-cycle catalogue import',
    defaultComposer: 'Franz Schubert',
    defaultInstrumentation: 'Piano accompaniment',
    status: 'COMPLETED',
    submittedAt: daysAgo(118),
    completedAt: daysAgo(116)
  },
  {
    key: 'opera-core',
    label: 'Principal opera aria import',
    defaultComposer: 'W. A. Mozart',
    defaultInstrumentation: 'Orchestral reduction for piano',
    status: 'COMPLETED',
    submittedAt: daysAgo(82),
    completedAt: daysAgo(79)
  },
  {
    key: 'anthology-upload',
    label: 'Arie Antiche studio anthology',
    defaultComposer: 'Various composers',
    defaultInstrumentation: 'Piano accompaniment',
    status: 'COMPLETED',
    submittedAt: daysAgo(54),
    completedAt: daysAgo(52)
  },
  {
    key: 'pending-review',
    label: 'July art-song review queue',
    defaultComposer: 'Various composers',
    defaultInstrumentation: 'Piano accompaniment',
    status: 'SUBMITTED',
    submittedAt: daysAgo(2)
  },
  {
    key: 'processing-batch',
    label: 'Technical study processing batch',
    defaultComposer: 'Various composers',
    defaultInstrumentation: 'Piano and rehearsal click',
    status: 'PARTIALLY_FAILED',
    submittedAt: daysAgo(4)
  },
  {
    key: 'draft-bulk-import',
    label: 'Autumn conservatoire bulk import',
    defaultComposer: 'Various composers',
    defaultInstrumentation: 'Piano accompaniment',
    status: 'DRAFT'
  },
  {
    key: 'archived-trial',
    label: 'Archived uploader trial import',
    defaultComposer: 'Various composers',
    defaultInstrumentation: 'Piano accompaniment',
    status: 'ARCHIVED',
    submittedAt: daysAgo(160),
    completedAt: daysAgo(151)
  }
]

const pendingReviewTitles = new Set([
  'Morgen',
  'Now sleeps the crimson petal',
  'Sea Fever',
  'Sleep',
  'Love went a-riding'
])

const processingTitles = new Set([
  'Practical Method: Manca sollecita',
  'Practical Method: Semplicetta tortorella'
])

const failedTitles = new Set([
  '50 Lessons, Op. 9: No. 1'
])

const rejectedTitles = new Set([
  '50 Lessons, Op. 9: No. 2'
])

const archivedTitles = new Set([
  'Vocalises, Op. 15: No. 1'
])

const customerKeys = [
  'customer',
  'customerBaritone',
  'customerPianist',
  'customerStudent',
  'customerConductor'
]

const uploaderKeys = [
  'mainUploader',
  'peerUploader',
  'uploaderTenor',
  'uploaderCoach'
]

const commentTemplates = [
  'The cueing is clear enough for slow practice without feeling mechanical.',
  'This sits at a useful rehearsal tempo and leaves space for breathing.',
  'The piano texture gives enough harmonic context to rehearse confidently.',
  'Very helpful for studio work where the accompaniment needs to repeat reliably.',
  'The balance makes entries easy to hear without covering the solo line.',
  'A good option for checking diction and line before a coaching session.',
  'The preview gives a fair sense of the accompaniment style and tempo.',
  'This would save time in early rehearsals before meeting a pianist.'
]

const uploaderReplyTemplates = [
  'Uploader note: I kept the accompaniment deliberately steady for first-stage rehearsal.',
  'Uploader note: I can prepare a slower or lower-key variant if there is enough demand.',
  'Uploader note: the preview section was chosen to show the main tempo and texture clearly.',
  'Uploader note: this reduction follows the common rehearsal score layout used in lessons.'
]

const cleanDatabase = async () => {
  await prisma.$transaction([
    prisma.requestPricingProposal.deleteMany(),
    prisma.trackRequestResponse.deleteMany(),
    prisma.trackRequest.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.paymentEvent.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.trackOwner.deleteMany(),
    prisma.catalogueReleaseTrack.deleteMany(),
    prisma.catalogueRelease.deleteMany(),
    prisma.track.deleteMany(),
    prisma.uploadBatch.deleteMany(),
    prisma.userAccessChangeRequest.deleteMany(),
    prisma.auditEvent.deleteMany()
  ])
}

const seedUserRecords = async () => {
  const users = {}

  for (const user of seedUsers) {
    users[user.key] = await prisma.user.upsert({
      where: {
        email: user.email
      },
      update: {
        name: user.name,
        role: user.role,
        uploaderStatus: user.uploaderStatus,
        accountStatus: user.accountStatus || 'ACTIVE'
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        uploaderStatus: user.uploaderStatus,
        accountStatus: user.accountStatus || 'ACTIVE'
      }
    })
  }

  return users
}

const seedBatches = async users => {
  const batches = {}

  for (const [index, batch] of batchDefinitions.entries()) {
    batches[batch.key] = await prisma.uploadBatch.create({
      data: {
        label: batch.label,
        defaultComposer: batch.defaultComposer,
        defaultInstrumentation: batch.defaultInstrumentation,
        defaultPricePence: index % 2 === 0 ? 599 : 699,
        status: batch.status,
        createdAt: daysAgo(130 - index * 12),
        updatedAt: daysAgo(120 - index * 10),
        submittedAt: batch.submittedAt,
        completedAt: batch.completedAt,
        uploadedBy: {
          connect: {
            id: users[uploaderKeys[index % uploaderKeys.length]].id
          }
        }
      }
    })
  }

  return batches
}

const getBatchKeyForTrack = track => {
  const trackLabel = track.titleInWork || track.title

  if (pendingReviewTitles.has(trackLabel)) {
    return 'pending-review'
  }

  if (processingTitles.has(trackLabel) || failedTitles.has(trackLabel) || rejectedTitles.has(trackLabel) || archivedTitles.has(trackLabel)) {
    return 'processing-batch'
  }

  if (track.workKey?.includes('schubert') || track.workKey?.includes('schumann') || track.workKey?.includes('mahler')) {
    return 'song-cycles-complete'
  }

  if (track.catalogueType === 'OPERA_EXCERPT') {
    return 'opera-core'
  }

  if (track.collectionFamily === 'Italian anthology') {
    return 'anthology-upload'
  }

  return 'song-cycles-complete'
}

const getTrackState = track => {
  const trackLabel = track.titleInWork || track.title

  if (pendingReviewTitles.has(trackLabel)) {
    return {
      status: 'PUBLISHED',
      moderationStatus: 'PENDING',
      processingStatus: 'READY',
      pricingReviewStatus: 'NEEDS_REVIEW',
      moderationNotes: 'Awaiting admin listening review before publication.'
    }
  }

  if (processingTitles.has(trackLabel)) {
    return {
      status: 'PROCESSING',
      moderationStatus: 'APPROVED',
      processingStatus: 'PROCESSING',
      pricingReviewStatus: 'AUTO_APPROVED',
      moderationNotes: 'Approved metadata; audio waveform processing still running.'
    }
  }

  if (failedTitles.has(trackLabel)) {
    return {
      status: 'PROCESSING',
      moderationStatus: 'APPROVED',
      processingStatus: 'FAILED',
      pricingReviewStatus: 'AUTO_APPROVED',
      processingError: 'Waveform extraction failed; uploader needs to replace the source file.'
    }
  }

  if (rejectedTitles.has(trackLabel)) {
    return {
      status: 'REJECTED',
      moderationStatus: 'REJECTED',
      processingStatus: 'READY',
      pricingReviewStatus: 'AUTO_APPROVED',
      moderationNotes: 'Rejected because the uploaded guide track contained copyrighted commercial audio.'
    }
  }

  if (archivedTitles.has(trackLabel)) {
    return {
      status: 'ARCHIVED',
      moderationStatus: 'APPROVED',
      processingStatus: 'READY',
      pricingReviewStatus: 'AUTO_APPROVED',
      moderationNotes: 'Archived after replacement by a cleaner version.'
    }
  }

  return {
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    processingStatus: 'READY',
    pricingReviewStatus: 'AUTO_APPROVED'
  }
}

const getUploaderForTrack = (track, index, users) => {
  if (track.catalogueType === 'OPERA_EXCERPT') {
    return users.peerUploader
  }

  if (track.collectionFamily === 'Italian anthology') {
    return users.uploaderTenor
  }

  if (track.catalogueType === 'LEARNING_PACK') {
    return users.uploaderCoach
  }

  return users[uploaderKeys[index % uploaderKeys.length]]
}

const seedTracks = async ({ batches, users }) => {
  const tracksBySlug = new Map()
  const tracks = []

  for (const [index, fixture] of pocCatalogueTracks.entries()) {
    const state = getTrackState(fixture)
    const uploader = getUploaderForTrack(fixture, index, users)
    const uploadedAt = daysAgo(150 - (index % 130), 8 + (index % 8))
    const batch = batches[getBatchKeyForTrack(fixture)]
    const isPublished = state.status === 'PUBLISHED' &&
      state.moderationStatus === 'APPROVED' &&
      state.processingStatus === 'READY'

    const track = await prisma.track.create({
      data: {
        fileName: `demo-fixtures/${fixture.slug}.wav`,
        previewFileName: `demo-fixtures/${fixture.slug}.wav`,
        title: fixture.title,
        composer: fixture.composer,
        status: state.status,
        moderationStatus: state.moderationStatus,
        processingStatus: state.processingStatus,
        uploadedAt,
        publishedAt: isPublished ? new Date(uploadedAt.getTime() + 2 * dayMs) : null,
        reviewedAt: state.moderationStatus === 'APPROVED' || state.moderationStatus === 'REJECTED'
          ? new Date(uploadedAt.getTime() + dayMs)
          : null,
        previewStart: 12 + (index % 18),
        previewEnd: 27 + (index % 18),
        durationSeconds: fixture.durationSeconds,
        sourceContentType: 'audio/wav',
        price: fixture.pricePence / 100,
        pricePence: fixture.pricePence,
        currency: 'gbp',
        formattedPrice: formatPrice(fixture.pricePence),
        catalogueType: fixture.catalogueType,
        saleFormat: 'INDIVIDUAL',
        pricingTier: `${fixture.catalogueType.toLowerCase().replace(/_/g, ' ')} ${formatPrice(fixture.pricePence)}`,
        pricingReviewStatus: state.pricingReviewStatus,
        pricingJustification: state.pricingReviewStatus === 'NEEDS_REVIEW'
          ? 'PoC fixture: higher-touch review queue item for admin pricing and moderation coverage.'
          : null,
        downloadName: `${fixture.slug}.wav`,
        downloadCount: fixture.downloadCount,
        key: fixture.key,
        instrumentation: fixture.instrumentation,
        additionalInfo: fixture.additionalInfo,
        moderationNotes: state.moderationNotes,
        processingError: state.processingError,
        uploadedBy: {
          connect: {
            id: uploader.id
          }
        },
        uploadBatch: {
          connect: {
            id: batch.id
          }
        }
      }
    })

    tracksBySlug.set(fixture.slug, track)
    tracks.push(track)
  }

  return {
    tracks,
    tracksBySlug
  }
}

const getReleaseState = definition => {
  if (definition.key === 'mozart-cosi-complete-rehearsal-score') {
    return {
      status: 'SUBMITTED',
      pricingReviewStatus: 'NEEDS_REVIEW',
      pricingJustification: 'Complete rehearsal score pricing requires admin approval.'
    }
  }

  if (definition.key === 'verdi-rigoletto-role-pack') {
    return {
      status: 'NEEDS_CHANGES',
      pricingReviewStatus: 'APPROVED',
      pricingJustification: 'Needs updated role-pack description before publication.'
    }
  }

  if (definition.key === 'bizet-carmen-role-pack') {
    return {
      status: 'REJECTED',
      pricingReviewStatus: 'REJECTED',
      pricingJustification: 'Rejected in PoC data to exercise release rejection review state.'
    }
  }

  if (definition.key === 'mahler-ruckert') {
    return {
      status: 'ARCHIVED',
      pricingReviewStatus: 'APPROVED',
      pricingJustification: 'Archived after replacement by a revised collection.'
    }
  }

  return {
    status: 'PUBLISHED',
    pricingReviewStatus: 'AUTO_APPROVED',
    pricingJustification: null
  }
}

const seedReleases = async ({ tracksBySlug, users }) => {
  const releasesByKey = new Map()

  for (const [index, definition] of pocReleaseDefinitions.entries()) {
    const firstTrack = tracksBySlug.get(definition.trackSlugs[0])
    const uploaderId = firstTrack?.userId || users.mainUploader.id
    const state = getReleaseState(definition)
    const createdAt = daysAgo(120 - (index % 90), 10)

    const release = await prisma.catalogueRelease.create({
      data: {
        title: definition.title,
        composer: definition.composer,
        status: state.status,
        catalogueType: definition.catalogueType,
        saleFormat: definition.saleFormat,
        pricePence: definition.pricePence,
        currency: 'gbp',
        formattedPrice: formatPrice(definition.pricePence),
        pricingReviewStatus: state.pricingReviewStatus,
        pricingJustification: state.pricingJustification,
        createdAt,
        updatedAt: new Date(createdAt.getTime() + 3 * dayMs),
        uploadedBy: {
          connect: {
            id: uploaderId
          }
        },
        tracks: {
          create: definition.trackSlugs.map((slug, position) => ({
            track: {
              connect: {
                id: tracksBySlug.get(slug).id
              }
            },
            position: position + 1,
            movementNo: `${position + 1}`,
            titleInWork: pocCatalogueTracks.find(track => track.slug === slug)?.titleInWork || tracksBySlug.get(slug).title
          }))
        },
        tags: {
          create: definition.tagSlugs.map(slug => ({
            tag: {
              connect: {
                slug
              }
            }
          }))
        }
      }
    })

    releasesByKey.set(definition.key, release)
  }

  return releasesByKey
}

const createTrackOwner = async ({ sourceRelease = null, track, user, purchasedAt }) => {
  await prisma.trackOwner.upsert({
    where: {
      trackId_userId: {
        trackId: track.id,
        userId: user.id
      }
    },
    update: {
      sourceReleaseId: sourceRelease?.id || null,
      sourceReleaseTitle: sourceRelease?.title || null,
      purchasedAt
    },
    create: {
      trackId: track.id,
      userId: user.id,
      sourceReleaseId: sourceRelease?.id || null,
      sourceReleaseTitle: sourceRelease?.title || null,
      purchasedAt
    }
  })
}

const seedPaidOrder = async ({ items, release = null, sessionKey, user, purchasedAt }) => {
  const amountTotal = release?.pricePence || items.reduce((total, track) => total + (track.pricePence || 0), 0)
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      status: 'PAID',
      currency: 'gbp',
      amountTotal,
      stripeCheckoutSession: `cs_poc_${sessionKey}`,
      stripePaymentIntent: `pi_poc_${sessionKey}`,
      createdAt: purchasedAt,
      updatedAt: purchasedAt,
      items: {
        create: items.map(track => ({
          trackId: track.id,
          sourceReleaseId: release?.id || null,
          sourceReleaseTitle: release?.title || null,
          title: track.title,
          composer: track.composer,
          unitAmount: release ? Math.round(amountTotal / items.length) : track.pricePence,
          currency: 'gbp'
        }))
      },
      paymentEvents: {
        create: {
          stripeEventId: `evt_poc_${sessionKey}`,
          type: 'checkout.session.completed',
          payload: JSON.stringify({
            id: `evt_poc_${sessionKey}`,
            type: 'checkout.session.completed',
            livemode: false,
            source: 'poc-seed'
          }),
          processedAt: purchasedAt
        }
      }
    }
  })

  for (const track of items) {
    await createTrackOwner({
      sourceRelease: release,
      track,
      user,
      purchasedAt
    })
  }

  return order
}

const seedPurchases = async ({ releasesByKey, tracksBySlug, users }) => {
  const getTracks = slugs => slugs.map(slug => tracksBySlug.get(slug)).filter(Boolean)
  const releaseOrderKeys = [
    ['customer', 'schubert-winterreise'],
    ['customer', 'rvw-songs-of-travel'],
    ['customerBaritone', 'schumann-dichterliebe'],
    ['customerPianist', 'arie-antiche-volume-one'],
    ['customerStudent', 'butterworth-shropshire-lad'],
    ['peerUploader', 'faure-bonne-chanson'],
    ['mainUploader', 'mozart-figaro-complete-rehearsal-score']
  ]

  for (const [index, [userKey, releaseKey]] of releaseOrderKeys.entries()) {
    const release = releasesByKey.get(releaseKey)
    if (!release) {
      continue
    }

    const definition = pocReleaseDefinitions.find(item => item.key === releaseKey)
    await seedPaidOrder({
      user: users[userKey],
      release,
      items: getTracks(definition.trackSlugs),
      sessionKey: `${userKey}_${releaseKey}`,
      purchasedAt: daysAgo(43 - index * 3, 14)
    })
  }

  const singleTrackOrders = [
    ['customer', ['w-a-mozart-le-nozze-di-figaro-k-492-voi-che-sapete', 'giacomo-puccini-la-boheme-si-mi-chiamano-mimi']],
    ['customerBaritone', ['georges-bizet-carmen-toreador-song', 'giuseppe-verdi-rigoletto-cortigiani-vil-razza-dannata']],
    ['customerPianist', ['franz-schubert-an-die-musik', 'henri-duparc-chanson-triste']],
    ['customerConductor', ['w-a-mozart-cosi-fan-tutte-k-588-soave-sia-il-vento', 'giuseppe-verdi-la-traviata-libiamo-ne-lieti-calici']],
    ['mainUploader', ['franz-schubert-winterreise-d-911-der-lindenbaum', 'gabriel-faure-apres-un-reve']]
  ]

  for (const [index, [userKey, slugs]] of singleTrackOrders.entries()) {
    await seedPaidOrder({
      user: users[userKey],
      items: getTracks(slugs),
      sessionKey: `${userKey}_singles_${index}`,
      purchasedAt: daysAgo(22 - index * 2, 16)
    })
  }
}

const seedComments = async ({ tracks, users }) => {
  const commenters = customerKeys.map(key => users[key])

  for (const [index, track] of tracks.entries()) {
    if (track.status !== 'PUBLISHED' || track.moderationStatus !== 'APPROVED' || track.processingStatus !== 'READY') {
      continue
    }

    if (index % 9 === 0) {
      continue
    }

    const commentCount = index % 17 === 0 ? 6 : 2 + (index % 3)
    const createdAtBase = new Date(track.uploadedAt.getTime() + 4 * dayMs)

    for (let offset = 0; offset < commentCount; offset += 1) {
      await prisma.comment.create({
        data: {
          trackId: track.id,
          userId: commenters[(index + offset) % commenters.length].id,
          content: commentTemplates[(index + offset) % commentTemplates.length],
          createdAt: new Date(createdAtBase.getTime() + offset * 2 * dayMs)
        }
      })
    }

    if (index % 5 === 0) {
      await prisma.comment.create({
        data: {
          trackId: track.id,
          userId: track.userId,
          content: uploaderReplyTemplates[index % uploaderReplyTemplates.length],
          createdAt: new Date(createdAtBase.getTime() + (commentCount + 1) * 2 * dayMs)
        }
      })
    }
  }
}

const findTrackByTitle = (tracks, fragment) => tracks.find(track => track.title.includes(fragment))

const seedRequests = async ({ tracks, users }) => {
  const requestTargets = [
    ['Voi che sapete', 'Slow practice tempo for Voi che sapete', 'Could this be available at a steadier teaching tempo for younger mezzos?', 'ACCEPTED', 'w-a-mozart-voi-che-sapete-slow-practice-accompaniment'],
    ['Voi che sapete', 'Lower-key Voi che sapete request', 'A lower option would help singers preparing an audition package.', 'PENDING_DECISION', null],
    ['Voi che sapete', 'Orchestral-colour version of Voi che sapete', 'Could the piano reduction include clearer woodwind cues before the vocal entry?', 'OPEN', null],
    ['The Vagabond', 'Lower-key Songs of Travel request', 'The baritone group at our studio needs a lower-key practice version.', 'COMPLETED', 'ralph-vaughan-williams-the-vagabond-lower-key-practice-track'],
    ['Der Lindenbaum', 'Slower Der Lindenbaum study track', 'Please create a slower study version with clearer left-hand pulse.', 'COMPLETED', 'franz-schubert-der-lindenbaum-slower-study-version'],
    ['Apres un reve', 'Cello transcription practice track', 'Could this be made available for cello and piano practice?', 'COMPLETED', 'gabriel-faure-apres-un-reve-cello-transcription-practice-track'],
    ['Dove sono', 'Dove sono recitative cue request', 'A version with a little more lead-in before the aria would be useful.', 'OPEN', null],
    ['La fleur que tu m avais jetee', 'Carmen flower song slower rehearsal', 'Could you add a version with slower tempo through the central section?', 'PENDING_DECISION', null],
    ['Si, mi chiamano Mimi', 'Mimi aria breath-friendly pacing', 'A slightly broader accompaniment would help early rehearsals.', 'ACCEPTED', null],
    ['Come scoglio', 'Come scoglio coloratura drill', 'Could the fast passage be available as a repeated drill?', 'OPEN', null],
    ['Ich grolle nicht', 'Dichterliebe medium voice request', 'A medium-key version would be very helpful for teaching.', 'PENDING_DECISION', null],
    ['The Roadside Fire', 'Roadside Fire diction tempo request', 'Could there be a lighter texture for diction work?', 'REJECTED', null],
    ['Caro mio ben', 'Caro mio ben beginner tempo', 'A slower beginner accompaniment would be ideal for first lessons.', 'OPEN', null],
    ['Lascia ch io pianga', 'Lascia ch io pianga ornamented cue', 'Could the da capo have a discreet ornament guide?', 'PENDING_DECISION', null],
    ['Music for a while', 'Purcell continuo-only option', 'A simpler continuo version would help early music workshops.', 'ACCEPTED', null],
    ['Sea Fever', 'Sea Fever recital tempo request', 'Please add a slightly faster recital tempo.', 'OPEN', null],
    ['Verborgenheit', 'Wolf lieder diction guide', 'Could the consonant cue be clearer in the accompaniment?', 'OPEN', null],
    ['O soave fanciulla', 'La boheme duet rehearsal split', 'Could this duet be split into separate role practice tracks?', 'PENDING_DECISION', null],
    ['Caro nome', 'Caro nome breath practice request', 'Could you create a version with longer breath spaces?', 'REJECTED', null],
    ['Ombra mai fu', 'Ombra mai fu lower strings reduction', 'A warmer lower-register accompaniment would be useful.', 'ACCEPTED', null],
    ['Der Leiermann', 'Der Leiermann drone balance request', 'Could the repeated figure sit a little softer under the voice?', 'OPEN', null],
    ['Let Beauty Awake', 'Songs of Travel piano-only balance', 'Could the piano texture be less dense in the second verse?', 'PENDING_DECISION', null],
    ['Soave sia il vento', 'Soave sia il vento trio cueing', 'Please add clearer entry cues for each singer.', 'OPEN', null],
    ['La ci darem la mano', 'Don Giovanni duet role split', 'Could there be separate Zerlina and Giovanni practice versions?', 'PENDING_DECISION', null],
    ['Deh vieni, non tardar', 'Susanna aria garden-scene cue', 'A longer lead-in from the recitative would be very useful.', 'ACCEPTED', null],
    ['Ging heut Morgen ubers Feld', 'Mahler orchestral colour request', 'Could this have more prominent horn and string cues?', 'OPEN', null],
    ['Il pleure dans mon coeur', 'Debussy French diction support', 'A version with a slightly steadier pulse would help students.', 'COMPLETED', null],
    ['An die Musik', 'An die Musik transposition request', 'A version one tone lower would be helpful for community choirs.', 'PENDING_DECISION', null],
    ['Toreador Song', 'Toreador Song chorus cue request', 'Could the choral responses be cued more clearly?', 'OPEN', null],
    ['Manca sollecita', 'Vaccai lesson with slower piano guide', 'A very slow technical version would help younger singers.', 'ACCEPTED', null]
  ]

  for (const [index, [trackFragment, title, notes, status, fulfilledSlug]] of requestTargets.entries()) {
    const track = findTrackByTitle(tracks, trackFragment)
    const requestedBy = users[customerKeys[index % customerKeys.length]]
    const uploader = track ? await prisma.user.findUnique({ where: { id: track.userId } }) : users.mainUploader
    const alternateUploader = [users.peerUploader, users.peerUploaderTwo, users.mainUploader]
      .find(candidate => candidate?.id && candidate.id !== uploader?.id) || users.peerUploader
    const fulfilledTrack = fulfilledSlug ? tracks.find(item => item.fileName === `demo-fixtures/${fulfilledSlug}.wav`) : null
    const createdAt = index % 10 === 8
      ? daysAgo(78 - (index % 6), 11)
      : daysAgo(32 - index, 11)
    const expiresAt = new Date(createdAt.getTime() + 60 * dayMs)
    const hasAcceptedResponse = ['PENDING_DECISION', 'ACCEPTED', 'COMPLETED'].includes(status)
    const responseReviewStatus = status === 'COMPLETED'
      ? 'AUTO_APPROVED'
      : index % 5 === 0 ? 'NEEDS_REVIEW' : 'AUTO_APPROVED'
    const responsePricePence = status === 'COMPLETED' ? 499 : 699
    const responseCreatedAt = daysAgo(Math.max(2, 28 - (index % 18)), 13)
    const responses = []

    if (hasAcceptedResponse) {
      responses.push({
        respondedById: uploader.id,
        pricePence: responsePricePence,
        currency: 'gbp',
        catalogueType: 'SINGLE_TRACK',
        saleFormat: 'INDIVIDUAL',
        pricingReviewStatus: responseReviewStatus,
        pricingJustification: 'Community request fulfilment priced within the guided CMC band.',
        responseNote: status === 'COMPLETED'
          ? 'Prepared and uploaded in response to community demand.'
          : 'Accepted for preparation within the current request window.',
        status: status === 'COMPLETED' ? 'COMPLETED' : 'ACCEPTED',
        createdAt: responseCreatedAt,
        updatedAt: new Date(responseCreatedAt.getTime() + 2 * dayMs),
        completedAt: status === 'COMPLETED' ? daysAgo(Math.max(1, 18 - (index % 12)), 13) : null,
        fulfilledByTrackId: fulfilledTrack?.id
      })
    }

    if (status === 'REJECTED') {
      responses.push({
        respondedById: uploader.id,
        responseNote: 'Thanks for the suggestion; I cannot prepare this version at the moment.',
        rejectionReason: 'outside_catalogue_plans',
        rejectionNote: 'This is outside my current preparation plan, but another uploader may still respond.',
        status: 'DECLINED',
        createdAt: responseCreatedAt,
        updatedAt: new Date(responseCreatedAt.getTime() + dayMs)
      })
    }

    if (index % 7 === 0) {
      responses.push({
        respondedById: alternateUploader.id,
        pricePence: 499,
        currency: 'gbp',
        catalogueType: 'SINGLE_TRACK',
        saleFormat: 'INDIVIDUAL',
        pricingReviewStatus: 'AUTO_APPROVED',
        pricingJustification: 'Alternative uploader response using a standard single-track band.',
        responseNote: 'I can prepare an alternate approach if this request remains active.',
        status: 'ACCEPTED',
        createdAt: new Date(responseCreatedAt.getTime() + dayMs),
        updatedAt: new Date(responseCreatedAt.getTime() + 3 * dayMs)
      })
    }

    await prisma.trackRequest.create({
      data: {
        title,
        composer: track?.composer || null,
        instrumentation: track?.instrumentation || null,
        notes,
        status: fulfilledTrack ? 'COMPLETED' : 'OPEN',
        createdAt,
        expiresAt,
        requestedBy: {
          connect: {
            id: requestedBy.id
          }
        },
        track: track
          ? {
              connect: {
                id: track.id
              }
            }
          : undefined,
        fulfilledByTrack: fulfilledTrack
          ? {
              connect: {
                id: fulfilledTrack.id
              }
            }
          : undefined,
        responses: responses.length > 0
          ? {
              create: responses
            }
          : undefined
      }
    })
  }
}

const seedWishlist = async ({ tracks, users }) => {
  const publicTracks = tracks.filter(track => (
    track.status === 'PUBLISHED' &&
    track.moderationStatus === 'APPROVED' &&
    track.processingStatus === 'READY'
  ))

  for (const [index, userKey] of customerKeys.entries()) {
    const user = users[userKey]
    const picks = publicTracks.slice(6 + index * 8, 10 + index * 8)

    for (const track of picks) {
      await prisma.wishlistItem.create({
        data: {
          trackId: track.id,
          userId: user.id,
          createdAt: daysAgo(12 - index, 12)
        }
      })
    }
  }
}

const seedAccessRequests = async users => {
  await prisma.userAccessChangeRequest.createMany({
    data: [
      {
        targetUserId: users.pendingUploader.id,
        requestedById: users.support.id,
        status: 'PENDING',
        requestedUploaderStatus: 'APPROVED',
        reason: 'Uploader application includes a conservatoire rehearsal catalogue ready for review.',
        createdAt: daysAgo(3, 10)
      },
      {
        targetUserId: users.customerBaritone.id,
        requestedById: users.support.id,
        reviewedById: users.admin.id,
        status: 'APPROVED',
        requestedRole: 'UPLOADER',
        requestedUploaderStatus: 'APPROVED',
        reason: 'Experienced accompanist invited to upload studio material.',
        reviewNote: 'Approved after portfolio review.',
        createdAt: daysAgo(34, 10),
        reviewedAt: daysAgo(33, 12),
        appliedAt: daysAgo(33, 12)
      },
      {
        targetUserId: users.suspendedCustomer.id,
        requestedById: users.support.id,
        reviewedById: users.admin.id,
        status: 'REJECTED',
        requestedAccountStatus: 'ACTIVE',
        reason: 'User requested reinstatement after account suspension.',
        reviewNote: 'Rejected pending further copyright clarification.',
        createdAt: daysAgo(18, 10),
        reviewedAt: daysAgo(16, 15)
      }
    ]
  })
}

const seedAuditEvents = async ({ releasesByKey, tracks, users }) => {
  const pendingTracks = tracks.filter(track => track.moderationStatus === 'PENDING')
  const failedTrack = tracks.find(track => track.processingStatus === 'FAILED')
  const firstRelease = releasesByKey.get('mozart-cosi-complete-rehearsal-score')

  const events = [
    ...pendingTracks.map(track => ({
      action: auditActions.trackSubmitted,
      actorId: track.userId,
      entityType: 'Track',
      entityId: `${track.id}`,
      metadata: JSON.stringify({
        route: '/api/tracks',
        moderationStatus: track.moderationStatus,
        processingStatus: track.processingStatus
      }),
      createdAt: daysAgo(2, 14)
    })),
    {
      action: auditActions.uploadBatchSubmitted,
      actorId: users.uploaderCoach.id,
      entityType: 'UploadBatch',
      entityId: 'processing-batch',
      metadata: JSON.stringify({
        status: 'PARTIALLY_FAILED',
        failedTracks: failedTrack ? 1 : 0
      }),
      createdAt: daysAgo(4, 15)
    },
    {
      action: auditActions.worksCollectionCreated,
      actorId: users.peerUploader.id,
      entityType: 'CatalogueRelease',
      entityId: firstRelease ? `${firstRelease.id}` : 'unknown',
      metadata: JSON.stringify({
        status: firstRelease?.status,
        pricingReviewStatus: firstRelease?.pricingReviewStatus
      }),
      createdAt: daysAgo(5, 11)
    },
    {
      action: auditActions.trackAccessDenied,
      actorId: users.customerStudent.id,
      entityType: 'Track',
      entityId: `${tracks[4].id}`,
      metadata: JSON.stringify({
        mode: 'full',
        reason: 'track_access_denied',
        route: '/api/tracks/[trackId]/signed-url'
      }),
      createdAt: daysAgo(1, 19)
    },
    {
      action: auditActions.userAccessChangeRequested,
      actorId: users.support.id,
      entityType: 'User',
      entityId: users.pendingUploader.id,
      metadata: JSON.stringify({
        attemptedFields: ['uploaderStatus'],
        requestStatus: 'PENDING'
      }),
      createdAt: daysAgo(3, 10)
    },
    {
      action: auditActions.stripeWebhookSignatureFailed,
      actorId: null,
      entityType: 'StripeWebhook',
      entityId: 'evt_poc_bad_signature',
      metadata: JSON.stringify({
        route: '/api/stripe/webhook',
        reason: 'signature_verification_failed'
      }),
      createdAt: daysAgo(6, 18)
    }
  ]

  await prisma.auditEvent.createMany({
    data: events
  })
}

const seed = async () => {
  await cleanDatabase()
  const users = await seedUserRecords()
  const batches = await seedBatches(users)
  const { tracks, tracksBySlug } = await seedTracks({ batches, users })
  const releasesByKey = await seedReleases({ tracksBySlug, users })

  await seedPurchases({ releasesByKey, tracksBySlug, users })
  await seedComments({ tracks, users })
  await seedRequests({ tracks, users })
  await seedWishlist({ tracks, users })
  await seedAccessRequests(users)
  await seedAuditEvents({ releasesByKey, tracks, users })

  const [
    totalTracks,
    publicTracks,
    pendingReviewTracks,
    releaseCount,
    requestCount,
    commentCount
  ] = await Promise.all([
    prisma.track.count(),
    prisma.track.count({
      where: {
        status: 'PUBLISHED',
        moderationStatus: 'APPROVED',
        processingStatus: 'READY'
      }
    }),
    prisma.track.count({
      where: {
        moderationStatus: 'PENDING'
      }
    }),
    prisma.catalogueRelease.count(),
    prisma.trackRequest.count(),
    prisma.comment.count()
  ])

  console.log(`Seeded ${totalTracks} PoC tracks (${publicTracks} public, ${pendingReviewTracks} pending admin review)`)
  console.log(`Seeded ${releaseCount} Works & Collections, ${requestCount} requests, and ${commentCount} comments`)
  console.log('Primary local test users: e2e-uploader@example.com, e2e-customer@example.com, e2e-admin@example.com, e2e-support@example.com')
}

try {
  await seed()
} finally {
  await prisma.$disconnect()
}
