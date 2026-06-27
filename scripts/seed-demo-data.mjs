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
      downloadCount: 0,
      key: track.key,
      instrumentation: track.instrumentation,
      additionalInfo: track.additionalInfo
    }

    if (existing) {
      await prisma.track.update({
        where: {
          id: existing.id
        },
        data
      })
    } else {
      await prisma.track.create({
        data
      })
    }
  }

  console.log(`Seeded ${demoCatalogueTracks.length} demo tracks for ${email}`)
}

try {
  await seed()
} finally {
  await prisma.$disconnect()
}
