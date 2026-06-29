export const auditActions = {
  checkoutCreated: 'checkout.created',
  ownershipGranted: 'ownership.granted',
  rateLimitExceeded: 'rate_limit.exceeded',
  trackAccessDenied: 'track_access.denied',
  trackAccessSignedUrlIssued: 'track_access.signed_url_issued',
  trackModerationUpdated: 'track_moderation.updated',
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
