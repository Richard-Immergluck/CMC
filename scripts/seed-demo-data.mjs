import AWS from 'aws-sdk'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { demoCatalogueTracks } from '../lib/demo/catalogue-fixtures.mjs'

const requiredEnv = [
  'DATABASE_URL',
  'S3_ACCESS_ID',
  'S3_APP_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'S3_REGION'
]

const missing = requiredEnv.filter(name => !process.env[name])

if (missing.length > 0) {
  throw new Error(`Missing required seed environment variables: ${missing.join(', ')}`)
}

if (process.env.CMC_ALLOW_PRODUCTION_SEED !== 'true' && process.env.VERCEL_ENV === 'production') {
  throw new Error('Refusing to seed production without CMC_ALLOW_PRODUCTION_SEED=true')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL
  })
})

const seededCommenters = [
  {
    email: process.env.DEMO_SEED_COMMENTER_EMAIL || 'demo-listener@example.com',
    name: process.env.DEMO_SEED_COMMENTER_NAME || 'Demo Listener'
  },
  {
    email: 'demo-soprano@example.com',
    name: 'Amelia Hart'
  },
  {
    email: 'demo-cellist@example.com',
    name: 'Jonah Reed'
  },
  {
    email: 'demo-repetiteur@example.com',
    name: 'Nadia Clarke'
  },
  {
    email: 'demo-conductor@example.com',
    name: 'Marcus Vale'
  },
  {
    email: 'demo-student@example.com',
    name: 'Priya Mason'
  },
  {
    email: 'demo-teacher@example.com',
    name: 'Eleanor Shaw'
  },
  {
    email: 'demo-oboist@example.com',
    name: 'Felix Turner'
  }
]

const seededCommentTemplates = [
  'Clear cueing and a useful rehearsal balance for working through the middle section.',
  'The preview gives enough of the texture to understand whether this will suit a lesson or practice session.',
  'This sits at a practical tempo and leaves enough space to hear entries clearly.',
  'The accompaniment texture is helpful without overwhelming the solo line.',
  'I would use this for first rehearsals before moving to a full ensemble recording.',
  'The balance feels especially useful for checking intonation and phrase endings.',
  'A slower alternative would be welcome, but this version is already useful for daily practice.',
  'Good for sectional work because the pulse stays clear through the transitions.',
  'The reduction gives enough harmonic information for confident rehearsal.',
  'This would be helpful in a teaching studio where students need repeatable accompaniment.'
]

const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_ID,
  secretAccessKey: process.env.S3_APP_ACCESS_KEY,
  region: process.env.S3_REGION,
  signatureVersion: 'v4'
})

const writeAscii = (buffer, offset, value) => buffer.write(value, offset, 'ascii')

const normalizeS3Prefix = prefix => {
  if (!prefix) {
    return ''
  }

  return `${prefix.replace(/^\/+/, '').replace(/\/+$/, '')}/`
}

const createToneWav = ({ frequency, seconds }) => {
  const sampleRate = 44100
  const channels = 1
  const bytesPerSample = 2
  const sampleCount = sampleRate * seconds
  const dataSize = sampleCount * channels * bytesPerSample
  const buffer = Buffer.alloc(44 + dataSize)

  writeAscii(buffer, 0, 'RIFF')
  buffer.writeUInt32LE(36 + dataSize, 4)
  writeAscii(buffer, 8, 'WAVE')
  writeAscii(buffer, 12, 'fmt ')
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(channels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28)
  buffer.writeUInt16LE(channels * bytesPerSample, 32)
  buffer.writeUInt16LE(8 * bytesPerSample, 34)
  writeAscii(buffer, 36, 'data')
  buffer.writeUInt32LE(dataSize, 40)

  for (let i = 0; i < sampleCount; i += 1) {
    const envelope = Math.min(1, i / 2000, (sampleCount - i) / 2000)
    const sample = Math.sin((2 * Math.PI * frequency * i) / sampleRate)
    buffer.writeInt16LE(Math.round(sample * envelope * 12000), 44 + i * 2)
  }

  return buffer
}

const cleanStaleDemoTracks = async userId => {
  const currentTrackFilters = demoCatalogueTracks.map(track => ({
    title: track.title,
    composer: track.composer
  }))
  const staleTracks = await prisma.track.findMany({
    where: {
      userId,
      additionalInfo: {
        contains: 'Synthetic CC0 catalogue fixture generated'
      },
      NOT: {
        OR: currentTrackFilters
      }
    },
    select: {
      id: true
    }
  })
  const staleTrackIds = staleTracks.map(track => track.id)

  if (staleTrackIds.length === 0) {
    return 0
  }

  const staleOrderItems = await prisma.orderItem.findMany({
    where: {
      trackId: {
        in: staleTrackIds
      }
    },
    select: {
      orderId: true
    }
  })
  const staleOrderIds = [...new Set(staleOrderItems.map(item => item.orderId))]

  await prisma.$transaction([
    prisma.paymentEvent.deleteMany({
      where: {
        orderId: {
          in: staleOrderIds
        }
      }
    }),
    prisma.orderItem.deleteMany({
      where: {
        trackId: {
          in: staleTrackIds
        }
      }
    }),
    prisma.order.deleteMany({
      where: {
        id: {
          in: staleOrderIds
        }
      }
    }),
    prisma.comment.deleteMany({
      where: {
        trackId: {
          in: staleTrackIds
        }
      }
    }),
    prisma.trackOwner.deleteMany({
      where: {
        trackId: {
          in: staleTrackIds
        }
      }
    }),
    prisma.track.deleteMany({
      where: {
        id: {
          in: staleTrackIds
        }
      }
    })
  ])

  return staleTrackIds.length
}

const uploadFixture = async track => {
  const key = `${normalizeS3Prefix(process.env.S3_KEY_PREFIX)}demo-fixtures/${track.slug}.wav`
  const body = createToneWav({
    frequency: track.frequency,
    seconds: track.seconds
  })

  await s3
    .putObject({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: 'audio/wav',
      Metadata: {
        license: 'cc0-synthetic-fixture',
        source: 'generated-by-cmc-seed-script'
      }
    })
    .promise()

  return key
}

const seed = async () => {
  const email = process.env.DEMO_SEED_USER_EMAIL || 'demo-uploader@example.com'
  const name = process.env.DEMO_SEED_USER_NAME || 'Demo Uploader'

  const user = await prisma.user.upsert({
    where: {
      email
    },
    update: {
      name,
      role: 'UPLOADER',
      uploaderStatus: 'APPROVED',
      accountStatus: 'ACTIVE'
    },
    create: {
      email,
      name,
      role: 'UPLOADER',
      uploaderStatus: 'APPROVED',
      accountStatus: 'ACTIVE'
    }
  })
  const staleDemoTrackCount = await cleanStaleDemoTracks(user.id)

  const commenters = []

  for (const commenter of seededCommenters) {
    commenters.push(await prisma.user.upsert({
      where: {
        email: commenter.email
      },
      update: {
        name: commenter.name,
        role: 'CUSTOMER',
        accountStatus: 'ACTIVE'
      },
      create: {
        email: commenter.email,
        name: commenter.name,
        role: 'CUSTOMER',
        accountStatus: 'ACTIVE'
      }
    }))
  }

  for (const track of demoCatalogueTracks) {
    const fileName = await uploadFixture(track)
    const now = new Date()
    const existing = await prisma.track.findFirst({
      where: {
        title: track.title,
        composer: track.composer,
        userId: user.id
      }
    })

    const data = {
      fileName,
      title: track.title,
      composer: track.composer,
      status: 'PUBLISHED',
      moderationStatus: 'APPROVED',
      processingStatus: 'READY',
      publishedAt: now,
      reviewedAt: now,
      uploadedBy: {
        connect: {
          id: user.id
        }
      },
      previewStart: 0,
      previewEnd: Math.min(10, track.seconds),
      durationSeconds: track.durationSeconds,
      sourceContentType: 'audio/wav',
      price: track.pricePence / 100,
      pricePence: track.pricePence,
      currency: 'gbp',
      formattedPrice: track.formattedPrice,
      downloadName: `${track.slug}.wav`,
      downloadCount: track.downloadCount,
      key: track.key,
      instrumentation: track.instrumentation,
      additionalInfo: track.additionalInfo
    }

    const savedTrack = existing
      ? await prisma.track.update({
        where: {
          id: existing.id
        },
        data
      })
      : await prisma.track.create({
        data
      })

    await prisma.comment.deleteMany({
      where: {
        trackId: savedTrack.id,
        userId: {
          in: commenters.map(commenter => commenter.id)
        }
      }
    })

    const commentCount = track.slug.length % 5 === 0
      ? 7
      : track.slug.length % 4 === 0
        ? 6
        : 2 + (track.slug.length % 3)
    const createdAtBase = savedTrack.uploadedAt || now

    await prisma.comment.createMany({
      data: Array.from({ length: commentCount }, (_, index) => ({
        trackId: savedTrack.id,
        userId: commenters[index % commenters.length].id,
        content: seededCommentTemplates[(index + savedTrack.id) % seededCommentTemplates.length],
        createdAt: new Date(createdAtBase.getTime() + (index + 1) * 36 * 60 * 60 * 1000)
      }))
    })
  }

  console.log(`Seeded ${demoCatalogueTracks.length} demo tracks for ${email} with comments from ${commenters.length} demo listeners`)
  if (staleDemoTrackCount > 0) {
    console.log(`Removed ${staleDemoTrackCount} stale synthetic demo tracks`)
  }
}

try {
  await seed()
} finally {
  await prisma.$disconnect()
}
