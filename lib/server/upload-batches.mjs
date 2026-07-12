import {
  createForbiddenError,
  createNotFoundError,
  createValidationError
} from './api-core.mjs'
import prisma from './prisma.js'
import {
  auditActions,
  buildAuditEventData
} from './audit-core.mjs'
import {
  canSubmitUploadBatch,
  canEditUploadBatch,
  canAddTrackToUploadBatch,
  buildUploadBatchDiagnostics,
  getUploadBatchStatusAfterFailedTrackRemoval,
  maxUploadBatchTracks,
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
  capacity: {
    canAddTracks: canAddTrackToUploadBatch(batch),
    maxTracks: maxUploadBatchTracks,
    remainingTracks: Math.max(0, maxUploadBatchTracks - summarizeUploadBatch(batch).totalTracks)
  },
  id: batch.id,
  completedAt: batch.completedAt,
  createdAt: batch.createdAt,
  defaultComposer: batch.defaultComposer,
  defaultInstrumentation: batch.defaultInstrumentation,
  defaultPricePence: batch.defaultPricePence,
  diagnostics: buildUploadBatchDiagnostics(batch),
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
  return prisma.$transaction(async tx => {
    const batch = await tx.uploadBatch.create({
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

    await tx.auditEvent.create({
      data: buildAuditEventData({
        action: auditActions.uploadBatchCreated,
        actorId: user.id,
        entityType: 'UploadBatch',
        entityId: batch.id,
        metadata: {
          defaultComposerProvided: Boolean(batch.defaultComposer),
          defaultInstrumentationProvided: Boolean(batch.defaultInstrumentation),
          defaultPriceProvided: Boolean(batch.defaultPricePence),
          status: batch.status
        }
      })
    })

    return batch
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
  return prisma.$transaction(async tx => {
    const batch = await tx.uploadBatch.findFirst({
      where: {
        id: batchId,
        userId: user.id
      },
      include: uploadBatchInclude
    })

    if (!batch) {
      throw createNotFoundError('Upload batch not found')
    }

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
      if (input.status === 'SUBMITTED' && !canSubmitUploadBatch(batch)) {
        throw createForbiddenError('Upload batches must contain only successfully processed tracks before submission')
      }

      data.status = input.status
      data.submittedAt = input.status === 'SUBMITTED' ? new Date() : batch.submittedAt
    }

    const updatedBatch = await tx.uploadBatch.update({
      where: {
        id: batch.id
      },
      data,
      include: uploadBatchInclude
    })

    const submitted = batch.status !== 'SUBMITTED' && updatedBatch.status === 'SUBMITTED'

    await tx.auditEvent.create({
      data: buildAuditEventData({
        action: submitted ? auditActions.uploadBatchSubmitted : auditActions.uploadBatchUpdated,
        actorId: user.id,
        entityType: 'UploadBatch',
        entityId: batch.id,
        metadata: {
          after: {
            defaultComposerProvided: Boolean(updatedBatch.defaultComposer),
            defaultInstrumentationProvided: Boolean(updatedBatch.defaultInstrumentation),
            defaultPriceProvided: Boolean(updatedBatch.defaultPricePence),
            status: updatedBatch.status,
            trackCount: updatedBatch.tracks.length
          },
          before: {
            defaultComposerProvided: Boolean(batch.defaultComposer),
            defaultInstrumentationProvided: Boolean(batch.defaultInstrumentation),
            defaultPriceProvided: Boolean(batch.defaultPricePence),
            status: batch.status,
            trackCount: batch.tracks.length
          }
        }
      })
    })

    return updatedBatch
  })
}

export const removeFailedTrackFromUploadBatch = ({ batchId, trackId, user }) => {
  return prisma.$transaction(async tx => {
    const batch = await tx.uploadBatch.findFirst({
      where: {
        id: batchId,
        userId: user.id
      },
      include: uploadBatchInclude
    })

    if (!batch) {
      throw createNotFoundError('Upload batch not found')
    }

    if (!canEditUploadBatch(batch)) {
      throw createForbiddenError('Submitted upload batches cannot be edited')
    }

    const track = batch.tracks.find(batchTrack => batchTrack.id === trackId)

    if (!track) {
      throw createNotFoundError('Track not found in upload batch')
    }

    if (track.processingStatus !== 'FAILED') {
      throw createValidationError('Only failed tracks can be removed from an upload batch')
    }

    await tx.track.delete({
      where: {
        id: track.id
      }
    })

    const remainingBatch = await tx.uploadBatch.findFirst({
      where: {
        id: batch.id,
        userId: user.id
      },
      include: uploadBatchInclude
    })
    const nextStatus = getUploadBatchStatusAfterFailedTrackRemoval(remainingBatch)

    const updatedBatch = await tx.uploadBatch.update({
      where: {
        id: batch.id
      },
      data: {
        status: nextStatus
      },
      include: uploadBatchInclude
    })

    await tx.auditEvent.create({
      data: buildAuditEventData({
        action: auditActions.uploadBatchFailedTrackRemoved,
        actorId: user.id,
        entityType: 'UploadBatch',
        entityId: batch.id,
        metadata: {
          removedTrackId: track.id,
          status: nextStatus
        }
      })
    })

    return updatedBatch
  })
}
