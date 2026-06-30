import {
  buildAuditEventData,
  buildUserAccessChangeRequestMetadata,
  auditActions
} from './audit-core.mjs'
import {
  buildUserAccessChangeMetadata,
  getUserAccessChangeFields,
  requiresSecondReviewForUserAccessChange,
  toUserAccessChangeRequestAdminItem
} from './admin-core.mjs'
import {
  createConflictError,
  createNotFoundError
} from './api-core.mjs'
import { canUpdateUserAccess } from './permissions.mjs'
import prisma from './prisma.js'
import {
  toUserAccessChangeRequestData,
  toUserAccessUpdateData
} from './admin-access-requests-core.mjs'

export {
  toUserAccessChangeRequestData,
  toUserAccessUpdateData
}

export const createUserAccessChangeRequest = async ({
  actorId,
  targetUserId,
  input
}) => {
  const requestData = toUserAccessChangeRequestData({
    actorId,
    targetUserId,
    input
  })

  const request = await prisma.$transaction(async tx => {
    const createdRequest = await tx.userAccessChangeRequest.create({
      data: requestData,
      include: {
        targetUser: true,
        requestedBy: true,
        reviewedBy: true
      }
    })

    await tx.auditEvent.create({
      data: buildAuditEventData({
        action: auditActions.userAccessChangeRequested,
        actorId,
        entityType: 'User',
        entityId: targetUserId,
        metadata: buildUserAccessChangeRequestMetadata({
          attemptedFields: getUserAccessChangeFields(input),
          requestId: createdRequest.id,
          route: '/api/admin/users/[userId]',
          status: createdRequest.status
        })
      })
    })

    return createdRequest
  })

  return toUserAccessChangeRequestAdminItem(request)
}

export const applyDirectUserAccessUpdate = async ({
  actorId,
  targetUserId,
  input
}) => {
  const updateData = toUserAccessUpdateData(input)
  const before = await prisma.user.findUnique({
    where: {
      id: targetUserId
    }
  })

  if (!before) {
    throw createNotFoundError('User not found')
  }

  if (requiresSecondReviewForUserAccessChange({ before, input })) {
    return {
      requiresReview: true,
      user: before,
      accessChangeRequest: await createUserAccessChangeRequest({
        actorId,
        targetUserId,
        input
      })
    }
  }

  const after = await prisma.user.update({
    where: {
      id: targetUserId
    },
    data: updateData
  })

  await prisma.auditEvent.create({
    data: buildAuditEventData({
      action: auditActions.userAccessUpdated,
      actorId,
      entityType: 'User',
      entityId: targetUserId,
      metadata: buildUserAccessChangeMetadata({
        before,
        after
      })
    })
  })

  return {
    requiresReview: false,
    user: after
  }
}

export const reviewUserAccessChangeRequest = async ({
  actorId,
  requestId,
  decision,
  reviewNote
}) => {
  const result = await prisma.$transaction(async tx => {
    const request = await tx.userAccessChangeRequest.findUnique({
      where: {
        id: requestId
      },
      include: {
        targetUser: true,
        requestedBy: true,
        reviewedBy: true
      }
    })

    if (!request) {
      throw createNotFoundError('Access change request not found')
    }

    if (request.status !== 'PENDING') {
      throw createConflictError('Access change request has already been reviewed')
    }

    if (request.requestedById === actorId) {
      throw createConflictError('Access change requests require review by a different admin')
    }

    if (!canUpdateUserAccess({ actorId, targetUserId: request.targetUserId })) {
      throw createConflictError('Admins cannot review their own access changes')
    }

    if (decision === 'reject') {
      const rejectedRequest = await tx.userAccessChangeRequest.update({
        where: {
          id: requestId
        },
        data: {
          status: 'REJECTED',
          reviewedById: actorId,
          reviewedAt: new Date(),
          reviewNote
        },
        include: {
          targetUser: true,
          requestedBy: true,
          reviewedBy: true
        }
      })

      await tx.auditEvent.create({
        data: buildAuditEventData({
          action: auditActions.userAccessChangeRejected,
          actorId,
          entityType: 'UserAccessChangeRequest',
          entityId: requestId,
          metadata: buildUserAccessChangeRequestMetadata({
            attemptedFields: getUserAccessChangeFields({
              role: request.requestedRole,
              accountStatus: request.requestedAccountStatus,
              uploaderStatus: request.requestedUploaderStatus
            }),
            requestId,
            route: '/api/admin/user-access-requests/[requestId]',
            status: rejectedRequest.status
          })
        })
      })

      return {
        request: rejectedRequest,
        user: request.targetUser
      }
    }

    const updateData = toUserAccessUpdateData({
      role: request.requestedRole,
      accountStatus: request.requestedAccountStatus,
      uploaderStatus: request.requestedUploaderStatus
    })
    const after = await tx.user.update({
      where: {
        id: request.targetUserId
      },
      data: updateData
    })
    const approvedRequest = await tx.userAccessChangeRequest.update({
      where: {
        id: requestId
      },
      data: {
        status: 'APPROVED',
        reviewedById: actorId,
        reviewedAt: new Date(),
        appliedAt: new Date(),
        reviewNote
      },
      include: {
        targetUser: true,
        requestedBy: true,
        reviewedBy: true
      }
    })

    await tx.auditEvent.createMany({
      data: [
        buildAuditEventData({
          action: auditActions.userAccessChangeApproved,
          actorId,
          entityType: 'UserAccessChangeRequest',
          entityId: requestId,
          metadata: buildUserAccessChangeRequestMetadata({
            attemptedFields: getUserAccessChangeFields(updateData),
            requestId,
            route: '/api/admin/user-access-requests/[requestId]',
            status: approvedRequest.status
          })
        }),
        buildAuditEventData({
          action: auditActions.userAccessUpdated,
          actorId,
          entityType: 'User',
          entityId: request.targetUserId,
          metadata: buildUserAccessChangeMetadata({
            before: request.targetUser,
            after
          })
        })
      ]
    })

    return {
      request: approvedRequest,
      user: after
    }
  })

  return {
    accessChangeRequest: toUserAccessChangeRequestAdminItem(result.request),
    user: result.user
  }
}
