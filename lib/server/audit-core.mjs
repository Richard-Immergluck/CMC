export const auditActions = {
  checkoutCreated: 'checkout.created',
  ownershipGranted: 'ownership.granted',
  trackAccessSignedUrlIssued: 'track_access.signed_url_issued'
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

