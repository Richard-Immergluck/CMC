export const auditActions = {
  authInactiveApiRejected: 'auth.inactive_api_rejected',
  authSignInDenied: 'auth.sign_in_denied',
  authSignOut: 'auth.sign_out',
  checkoutCreated: 'checkout.created',
  commentCreated: 'comment.created',
  worksCollectionArchived: 'works_collection.archived',
  worksCollectionCreated: 'works_collection.created',
  worksCollectionDeleted: 'works_collection.deleted',
  worksCollectionDependencyBlocked: 'works_collection.dependency_blocked',
  worksCollectionDependencyRepaired: 'works_collection.dependency_repaired',
  worksCollectionPricingReviewed: 'works_collection.pricing_reviewed',
  worksCollectionUpdated: 'works_collection.updated',
  ownershipGranted: 'ownership.granted',
  rateLimitExceeded: 'rate_limit.exceeded',
  requestPricingDecided: 'request_pricing.decided',
  requestPricingProposed: 'request_pricing.proposed',
  requestPricingReviewed: 'request_pricing.reviewed',
  requestResponseCompleted: 'track_request_response.completed',
  requestResponseUpdated: 'track_request_response.updated',
  trackAccessDenied: 'track_access.denied',
  trackAccessSignedUrlIssued: 'track_access.signed_url_issued',
  trackModerationUpdated: 'track_moderation.updated',
  trackMetadataUpdated: 'track.metadata_updated',
  trackPricingReviewed: 'track_pricing.reviewed',
  userAccessChangeApproved: 'user_access_change.approved',
  userAccessChangeRejected: 'user_access_change.rejected',
  userAccessChangeRequested: 'user_access_change.requested',
  userAccessSelfUpdateDenied: 'user_access.self_update_denied',
  uploadBatchCreated: 'upload_batch.created',
  uploadBatchFailedTrackRemoved: 'upload_batch.failed_track_removed',
  uploadBatchModerationCompleted: 'upload_batch.moderation_completed',
  uploadBatchSubmitted: 'upload_batch.submitted',
  uploadBatchUpdated: 'upload_batch.updated',
  stripeWebhookSignatureFailed: 'stripe.webhook_signature_failed',
  trackSubmitted: 'track.submitted',
  userAccessUpdated: 'user_access.updated'
}

export const serializeAuditMetadata = metadata => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return undefined
  }

  return JSON.stringify(metadata)
}

export const buildAuditEventData = ({
  action,
  actorId,
  entityType,
  entityId,
  metadata
}) => ({
  action,
  actorId: actorId || undefined,
  entityType,
  entityId: `${entityId}`,
    metadata: serializeAuditMetadata(metadata)
  })

export const buildTrackAccessDeniedMetadata = ({
  mode,
  reason,
  redirect,
  route
}) => ({
  mode,
  reason,
  redirect: Boolean(redirect),
  route
})

export const buildTrackSignedUrlIssuedMetadata = ({
  downloadName,
  expiresSeconds,
  mode,
  redirect,
  route,
  syntheticFixture
}) => ({
  mode,
  redirect: Boolean(redirect),
  route,
  syntheticFixture: Boolean(syntheticFixture),
  expiresSeconds,
  hasDownloadName: Boolean(downloadName)
})

export const buildRateLimitExceededMetadata = ({
  limit,
  remaining,
  resetAt,
  route,
  scope
}) => ({
  limit,
  remaining,
  resetAt,
  route,
  scope
})

export const buildAuthSignInDeniedMetadata = ({
  accountStatus,
  provider,
  reason
}) => ({
  accountStatus,
  provider: provider || 'unknown',
  reason
})

export const buildAuthSignOutMetadata = ({
  provider
} = {}) => ({
  provider: provider || 'unknown'
})

export const buildAuthInactiveApiRejectedMetadata = ({
  accountStatus,
  reason,
  route
}) => ({
  accountStatus,
  reason,
  route: route || 'unknown'
})

export const buildUserAccessDeniedMetadata = ({
  attemptedFields = [],
  reason,
  route
}) => ({
  attemptedFields: [...attemptedFields].sort(),
  reason,
  route
})

export const buildUserAccessChangeRequestMetadata = ({
  attemptedFields = [],
  requestId,
  route,
  status
}) => ({
  attemptedFields: [...attemptedFields].sort(),
  requestId,
  route,
  status
})

export const buildTrackSubmittedMetadata = ({
  catalogueType,
  currency,
  hasAdditionalInfo,
  pricePence,
  pricingReviewStatus,
  processingStatus,
  saleFormat,
  sourceContentType,
  status,
  moderationStatus
}) => ({
  currency,
  hasAdditionalInfo: Boolean(hasAdditionalInfo),
  pricePence,
  processingStatus,
  sourceContentType,
  status,
  moderationStatus,
  ...(catalogueType ? { catalogueType } : {}),
  ...(pricingReviewStatus ? { pricingReviewStatus } : {}),
  ...(saleFormat ? { saleFormat } : {})
})

export const buildTrackMetadataUpdatedMetadata = ({
  changedFields,
  route
}) => ({
  changedFields: [...changedFields].sort(),
  route
})

export const buildCommentCreatedMetadata = ({
  commentLength,
  route,
  trackId
}) => ({
  commentLength,
  route,
  trackId
})

export const buildWorksCollectionCreatedMetadata = ({
  catalogueType,
  pricePence,
  saleFormat,
  trackCount,
  trackIds
}) => ({
  catalogueType,
  pricePence,
  saleFormat,
  trackCount,
  trackIds
})

export const buildWorksCollectionUpdatedMetadata = ({
  after,
  before,
  trackIds
}) => ({
  after,
  before,
  trackIds
})

export const buildWorksCollectionDeletedMetadata = ({
  catalogueType,
  orderItemCount,
  status,
  title,
  trackCount,
  trackOwnerCount
}) => ({
  catalogueType,
  orderItemCount,
  status,
  title,
  trackCount,
  trackOwnerCount
})

export const buildStripeWebhookSignatureFailedMetadata = ({
  error,
  hasSignatureHeader,
  requestId,
  route
}) => ({
  error,
  hasSignatureHeader: Boolean(hasSignatureHeader),
  requestId,
  route
})
