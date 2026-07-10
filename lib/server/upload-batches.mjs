import {
  createForbiddenError,
  createNotFoundError
} from './api-core.mjs'
import prisma from './prisma.js'
import {
  canEditUploadBatch,
  normalizeUploadBatchDefaults,
  summarizeUploadBatch
} from './upload-batches-core.mjs'

const uploadBatchInclude = {
  tracks: {
    orderBy: {
      uploadedAt: 'desc'
    },
    select: {
      id: true,
      title: true,
      composer: true,
      moderationStatus: true,
      processingStatus: true,
      status: true,
      uploadedAt: true
    }
  }
}

export const serializeUploadBatch = batch => ({
  id: batch.id,
  completedAt: batch.completedAt,
  createdAt: batch.createdAt,
  defaultComposer: batch.defaultComposer,
  defaultInstrumentation: batch.defaultInstrumentation,
  defaultPricePence: batch.defaultPricePence,
  label: batch.label,
  status: batch.status,
  submittedAt: batch.submittedAt,
  summary: summarizeUploadBatch(batch),
  tracks: (batch.tracks || []).map(track => ({
    id: track.id,
    composer: track.composer,
    moderationStatus: track.moderationStatus,
    processingStatus: track.processingStatus,
    status: track.status,
    title: track.title,
    uploadedAt: track.uploadedAt
  })),
  updatedAt: batch.updatedAt
})

export const listUserUploadBatches = ({ userId }) => {
  return prisma.uploadBatch.findMany({
    where: {
      userId
    },
    include: uploadBatchInclude,
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  })
}

export const createUploadBatch = ({ input, user }) => {
  return prisma.uploadBatch.create({
    data: {
      ...normalizeUploadBatchDefaults(input),
      uploadedBy: {
        connect: {
          id: user.id
        }
      }
    },
    include: uploadBatchInclude
  })
}

export const getUserUploadBatch = async ({ batchId, userId }) => {
  const batch = await prisma.uploadBatch.findFirst({
    where: {
      id: batchId,
      userId
    },
    include: uploadBatchInclude
  })

  if (!batch) {
    throw createNotFoundError('Upload batch not found')
  }

  return batch
}

export const updateUploadBatch = async ({ batchId, input, user }) => {
  const batch = await getUserUploadBatch({
    batchId,
    userId: user.id
  })

  if (!canEditUploadBatch(batch)) {
    throw createForbiddenError('Submitted upload batches cannot be edited')
  }

  const normalizedDefaults = normalizeUploadBatchDefaults(input)
  const data = {}

  for (const field of ['label', 'defaultComposer', 'defaultInstrumentation', 'defaultPricePence']) {
    if (Object.hasOwn(input, field)) {
      data[field] = normalizedDefaults[field]
    }
  }

  if (input.status) {
    data.status = input.status
    data.submittedAt = input.status === 'SUBMITTED' ? new Date() : batch.submittedAt
  }

  return prisma.uploadBatch.update({
    where: {
      id: batch.id
    },
    data,
    include: uploadBatchInclude
  })
}
