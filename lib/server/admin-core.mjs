export const toAdminSummary = ({
  userCount,
  trackCount,
  pendingTrackCount,
  orderCount,
  paymentEventCount,
  auditEventCount
}) => ({
  users: userCount,
  tracks: trackCount,
  pendingTracks: pendingTrackCount,
  orders: orderCount,
  paymentEvents: paymentEventCount,
  auditEvents: auditEventCount
})

export const toTrackReviewItem = track => ({
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

export const toAuditEventQueryOptions = ({
  action,
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
  after: toUserAdminItem(after)
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
