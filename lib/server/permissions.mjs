import { createForbiddenError } from './api-core.mjs'

export const roles = {
  customer: 'CUSTOMER',
  uploader: 'UPLOADER',
  admin: 'ADMIN',
  support: 'SUPPORT'
}

export const accountStatuses = {
  active: 'ACTIVE',
  suspended: 'SUSPENDED',
  closed: 'CLOSED'
}

export const uploaderStatuses = {
  approved: 'APPROVED'
}

const elevatedRoles = new Set([roles.admin, roles.support])

export const isActiveUser = user => user?.accountStatus === accountStatuses.active

export const canUploadTracks = user => {
  if (!isActiveUser(user)) {
    return false
  }

  return user.role === roles.admin || (
    user.role === roles.uploader &&
    user.uploaderStatus === uploaderStatuses.approved
  )
}

export const canAccessAdminSurface = user => isActiveUser(user) && user?.role === roles.admin

export const canAccessSupportSurface = user => isActiveUser(user) && elevatedRoles.has(user?.role)

export const requirePermission = ({ user, allowed, message }) => {
  if (!allowed(user)) {
    throw createForbiddenError(message)
  }

  return user
}

export const requireTrackUploadPermission = user => requirePermission({
  user,
  allowed: canUploadTracks,
  message: 'Approved uploader access required'
})

export const requireAdminPermission = user => requirePermission({
  user,
  allowed: canAccessAdminSurface,
  message: 'Admin access required'
})

export const requireSupportPermission = user => requirePermission({
  user,
  allowed: canAccessSupportSurface,
  message: 'Support access required'
})
