export const toUserAccessUpdateData = input => ({
  ...(input.role !== undefined ? { role: input.role } : {}),
  ...(input.accountStatus !== undefined ? { accountStatus: input.accountStatus } : {}),
  ...(input.uploaderStatus !== undefined ? { uploaderStatus: input.uploaderStatus } : {})
})

export const toUserAccessChangeRequestData = ({ actorId, targetUserId, input }) => ({
  targetUserId,
  requestedById: actorId,
  requestedRole: input.role,
  requestedAccountStatus: input.accountStatus,
  requestedUploaderStatus: input.uploaderStatus,
  reason: input.reason || undefined
})
