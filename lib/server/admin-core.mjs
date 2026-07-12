import { summarizeUploadBatch } from './upload-batches-core.mjs'
import { getWorksCollectionPriceContext } from './works-collections-core.mjs'

export const trackReviewInclude = {
  releaseItems: {
    include: {
      release: {
        select: {
          _count: {
            select: {
              tracks: true
            }
          },
          catalogueType: true,
          id: true,
          pricingReviewStatus: true,
          saleFormat: true,
          status: true,
          title: true
        }
      }
    },
    orderBy: {
      position: 'asc'
    }
  },
  uploadBatch: {
    select: {
      _count: {
        select: {
          tracks: true
        }
      },
      id: true,
      label: true,
      status: true
    }
  },
  uploadedBy: true
}

export const toAdminSummary = ({
  userCount,
  trackCount,
  pendingTrackCount,
  orderCount,
  paymentEventCount,
  auditEventCount,
  uploadBatchCount,
  submittedUploadBatchCount,
  uploadBatchesNeedingAttentionCount
}) => ({
  users: userCount,
  tracks: trackCount,
  pendingTracks: pendingTrackCount,
  uploadBatches: uploadBatchCount,
  submittedUploadBatches: submittedUploadBatchCount,
  uploadBatchesNeedingAttention: uploadBatchesNeedingAttentionCount,
  orders: orderCount,
  paymentEvents: paymentEventCount,
  auditEvents: auditEventCount
})

export const toTrackReviewItem = track => ({
  worksCollections: (track.releaseItems || []).map(item => ({
    catalogueType: item.release?.catalogueType,
    id: item.release?.id,
    pricingReviewStatus: item.release?.pricingReviewStatus,
    saleFormat: item.release?.saleFormat,
    status: item.release?.status,
    title: item.release?.title,
    trackCount: item.release?._count?.tracks || 0
  })),
  uploadBatch: track.uploadBatch
    ? {
        id: track.uploadBatch.id,
        label: track.uploadBatch.label,
        status: track.uploadBatch.status,
        trackCount: track.uploadBatch._count?.tracks || 0
      }
    : null,
  id: track.id,
  title: track.title,
  composer: track.composer,
  status: track.status,
  moderationStatus: track.moderationStatus,
  processingStatus: track.processingStatus,
  uploadedAt: track.uploadedAt,
  uploader: track.uploadedBy
    ? {
        id: track.uploadedBy.id,
        name: track.uploadedBy.name,
        email: track.uploadedBy.email
      }
    : null
})

export const toUploadBatchAdminItem = batch => {
  const summary = summarizeUploadBatch(batch)

  return {
    id: batch.id,
    label: batch.label,
    status: batch.status,
    createdAt: batch.createdAt,
    submittedAt: batch.submittedAt,
    completedAt: batch.completedAt,
    summary: {
      ...summary,
      totalTracks: batch._count?.tracks ?? summary.totalTracks
    },
    uploader: batch.uploadedBy
      ? {
          id: batch.uploadedBy.id,
          name: batch.uploadedBy.name,
          email: batch.uploadedBy.email
        }
      : null,
    tracks: (batch.tracks || []).map(track => ({
      id: track.id,
      title: track.title,
      status: track.status,
      moderationStatus: track.moderationStatus,
      processingStatus: track.processingStatus,
      uploadedAt: track.uploadedAt
    }))
  }
}

export const toWorksCollectionAdminItem = release => ({
  catalogueType: release.catalogueType,
  createdAt: release.createdAt,
  formattedPrice: release.formattedPrice,
  ...getWorksCollectionPriceContext(release),
  id: release.id,
  pricePence: release.pricePence,
  pricingReviewStatus: release.pricingReviewStatus,
  saleFormat: release.saleFormat,
  status: release.status,
  title: release.title,
  trackCount: release._count?.tracks || 0,
  orderItemCount: release._count?.orderItems || 0,
  uploader: release.uploadedBy
    ? {
        id: release.uploadedBy.id,
        name: release.uploadedBy.name,
        email: release.uploadedBy.email
      }
    : null,
  tracks: (release.tracks || []).map(item => ({
    formattedPrice: item.track?.formattedPrice,
    id: item.track?.id,
    movementNo: item.movementNo,
    moderationStatus: item.track?.moderationStatus,
    position: item.position,
    pricePence: item.track?.pricePence,
    processingStatus: item.track?.processingStatus,
    status: item.track?.status,
    title: item.titleInWork || item.track?.title || 'Untitled track'
  }))
})

export const toUserAdminItem = user => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  accountStatus: user.accountStatus,
  uploaderStatus: user.uploaderStatus
})

export const privilegedRoles = ['ADMIN', 'SUPPORT']

export const userAccessInputFields = ['role', 'accountStatus', 'uploaderStatus']

export const getUserAccessChangeFields = input => {
  return userAccessInputFields.filter(field => input[field] !== undefined && input[field] !== null)
}

export const requiresSecondReviewForUserAccessChange = ({ before, input }) => {
  if (!before || !input) {
    return false
  }

  const grantsPrivilegedRole = input.role && privilegedRoles.includes(input.role)
  const changesPrivilegedUser = privilegedRoles.includes(before.role) && getUserAccessChangeFields(input).length > 0
  const reactivatesPrivilegedUser = privilegedRoles.includes(before.role) && input.accountStatus === 'ACTIVE'

  return Boolean(grantsPrivilegedRole || changesPrivilegedUser || reactivatesPrivilegedUser)
}

export const toOrderAdminItem = order => ({
  id: order.id,
  status: order.status,
  amountTotal: order.amountTotal,
  currency: order.currency,
  stripeCheckoutSession: order.stripeCheckoutSession,
  stripePaymentIntent: order.stripePaymentIntent,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  user: order.user
    ? {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email
      }
    : null,
  items: (order.items || []).map(item => ({
    id: item.id,
    trackId: item.trackId,
    sourceReleaseId: item.sourceReleaseId,
    sourceReleaseTitle: item.sourceReleaseTitle,
    title: item.title,
    composer: item.composer,
    unitAmount: item.unitAmount,
    currency: item.currency
  }))
})

export const toPaymentEventAdminItem = paymentEvent => ({
  id: paymentEvent.id,
  stripeEventId: paymentEvent.stripeEventId,
  type: paymentEvent.type,
  orderId: paymentEvent.orderId,
  processedAt: paymentEvent.processedAt
})

export const toAuditEventAdminItem = auditEvent => ({
  id: auditEvent.id,
  action: auditEvent.action,
  entityType: auditEvent.entityType,
  entityId: auditEvent.entityId,
  createdAt: auditEvent.createdAt,
  actor: auditEvent.actor
    ? {
        id: auditEvent.actor.id,
        name: auditEvent.actor.name,
        email: auditEvent.actor.email
      }
    : null
})

export const toUserAccessChangeRequestAdminItem = request => ({
  id: request.id,
  status: request.status,
  requestedRole: request.requestedRole,
  requestedAccountStatus: request.requestedAccountStatus,
  requestedUploaderStatus: request.requestedUploaderStatus,
  reasonProvided: Boolean(request.reason),
  reviewNoteProvided: Boolean(request.reviewNote),
  createdAt: request.createdAt,
  reviewedAt: request.reviewedAt,
  appliedAt: request.appliedAt,
  targetUser: request.targetUser ? toUserAdminItem(request.targetUser) : null,
  requestedBy: request.requestedBy
    ? {
        id: request.requestedBy.id,
        name: request.requestedBy.name,
        email: request.requestedBy.email
      }
    : null,
  reviewedBy: request.reviewedBy
    ? {
        id: request.reviewedBy.id,
        name: request.reviewedBy.name,
        email: request.reviewedBy.email
      }
    : null
})

export const auditEventCategories = {
  accountLifecycle: [
    'auth.inactive_api_rejected',
    'auth.sign_in_denied',
    'auth.sign_out',
    'user_access.self_update_denied',
    'user_access.updated',
    'user_access_change.requested',
    'user_access_change.approved',
    'user_access_change.rejected'
  ]
}

export const toAuditEventQueryOptions = ({
  action,
  auditCategory,
  actorId,
  entityType,
  entityId,
  createdFrom,
  createdTo,
  limit = 25
} = {}) => {
  const where = {}
  const createdAt = {}

  if (action) {
    where.action = action
  } else if (auditCategory && auditEventCategories[auditCategory]) {
    where.action = {
      in: auditEventCategories[auditCategory]
    }
  }

  if (actorId) {
    where.actorId = actorId
  }

  if (entityType) {
    where.entityType = entityType
  }

  if (entityId) {
    where.entityId = entityId
  }

  if (createdFrom) {
    createdAt.gte = createdFrom
  }

  if (createdTo) {
    createdAt.lte = createdTo
  }

  if (Object.keys(createdAt).length > 0) {
    where.createdAt = createdAt
  }

  return {
    where,
    take: Math.min(Math.max(Number(limit) || 25, 1), 100),
    orderBy: [
      {
        createdAt: 'desc'
      }
    ]
  }
}

export const buildUserAccessChangeMetadata = ({ before, after }) => ({
  before: toUserAdminItem(before),
  after: toUserAdminItem(after),
  sessionsRevoked: Boolean(after?.sessionRevokedBefore),
  sessionRevokedBefore: after?.sessionRevokedBefore || null
})

export const buildTrackModerationChangeMetadata = ({ before, after }) => ({
  before: {
    status: before.status,
    moderationStatus: before.moderationStatus,
    processingStatus: before.processingStatus
  },
  after: {
    status: after.status,
    moderationStatus: after.moderationStatus,
    processingStatus: after.processingStatus
  }
})
