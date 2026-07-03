export const shouldRevokeSessionsForAccessChange = input => {
  return ['role', 'accountStatus', 'uploaderStatus'].some(field => input[field] !== undefined)
}

export const toUserAccessUpdateData = (input, { now = new Date() } = {}) => ({
  ...(input.role !== undefined ? { role: input.role } : {}),
  ...(input.accountStatus !== undefined ? { accountStatus: input.accountStatus } : {}),
  ...(input.uploaderStatus !== undefined ? { uploaderStatus: input.uploaderStatus } : {}),
  ...(shouldRevokeSessionsForAccessChange(input) ? { sessionRevokedBefore: now } : {})
})

export const toUserAccessChangeRequestData = ({ actorId, targetUserId, input }) => ({
  targetUserId,
  requestedById: actorId,
  requestedRole: input.role,
  requestedAccountStatus: input.accountStatus,
  requestedUploaderStatus: input.uploaderStatus,
  reason: input.reason || undefined
})
