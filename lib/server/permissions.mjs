import { createForbiddenError } from './api-core.mjs'
import {
  accountStatuses,
  canAccessAdminSurface,
  canAccessSupportSurface,
  canUploadTracks,
  isActiveUser,
  roles,
  uploaderStatuses
} from '../access-control.mjs'

export {
  accountStatuses,
  canAccessAdminSurface,
  canAccessSupportSurface,
  canUploadTracks,
  isActiveUser,
  roles,
  uploaderStatuses
}

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
