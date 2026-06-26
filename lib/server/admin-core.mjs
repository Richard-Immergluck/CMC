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
