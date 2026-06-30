export const auditActions = {
  authSignInDenied: 'auth.sign_in_denied',
  authSignOut: 'auth.sign_out',
  checkoutCreated: 'checkout.created',
  commentCreated: 'comment.created',
  ownershipGranted: 'ownership.granted',
  rateLimitExceeded: 'rate_limit.exceeded',
  trackAccessDenied: 'track_access.denied',
  trackAccessSignedUrlIssued: 'track_access.signed_url_issued',
  trackModerationUpdated: 'track_moderation.updated',
  userAccessChangeApproved: 'user_access_change.approved',
  userAccessChangeRejected: 'user_access_change.rejected',
  userAccessChangeRequested: 'user_access_change.requested',
  userAccessSelfUpdateDenied: 'user_access.self_update_denied',
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
  currency,
  hasAdditionalInfo,
  pricePence,
  processingStatus,
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
  moderationStatus
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
