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
