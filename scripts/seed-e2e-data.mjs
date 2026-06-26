import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to seed E2E data')
}

if (process.env.VERCEL_ENV === 'production' && process.env.CMC_ALLOW_E2E_SEED !== 'true') {
  throw new Error('Refusing to seed E2E data in production without CMC_ALLOW_E2E_SEED=true')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL
  })
})

const seed = async () => {
  const uploader = await prisma.user.upsert({
    where: {
      email: 'e2e-uploader@example.com'
    },
    update: {
      name: 'E2E Uploader',
      role: 'UPLOADER',
      uploaderStatus: 'APPROVED',
      accountStatus: 'ACTIVE'
    },
    create: {
      email: 'e2e-uploader@example.com',
      name: 'E2E Uploader',
      role: 'UPLOADER',
      uploaderStatus: 'APPROVED',
      accountStatus: 'ACTIVE'
    }
  })

  const trackData = {
    fileName: 'e2e-fixtures/catalogue-navigation.wav',
    title: 'E2E Catalogue Navigation Study',
    composer: 'Synthetic Test Fixture',
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    processingStatus: 'READY',
    publishedAt: new Date('2026-06-25T12:00:00.000Z'),
    reviewedAt: new Date('2026-06-25T12:00:00.000Z'),
    uploadedBy: {
      connect: {
        id: uploader.id
      }
    },
    previewStart: 0,
    previewEnd: 10,
    durationSeconds: 12,
    sourceContentType: 'audio/wav',
    price: 2.99,
    pricePence: 299,
    currency: 'gbp',
    formattedPrice: 'GBP 2.99',
    downloadName: 'catalogue-navigation.wav',
    downloadCount: 0,
    key: 'C major',
    instrumentation: 'Piano guide tone',
    additionalInfo: 'Synthetic database-only fixture for browser smoke tests.'
  }

  const existingTrack = await prisma.track.findFirst({
    where: {
      title: trackData.title,
      composer: trackData.composer,
      userId: uploader.id
    }
  })

  if (existingTrack) {
    await prisma.track.update({
      where: {
        id: existingTrack.id
      },
      data: trackData
    })
  } else {
    await prisma.track.create({
      data: trackData
    })
  }

  console.log(`Seeded E2E catalogue track for ${uploader.email}`)
}

try {
  await seed()
} finally {
  await prisma.$disconnect()
}
