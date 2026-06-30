import { createForbiddenError } from './api-core.mjs'
import { isActiveUser } from './permissions.mjs'

export const getRouteSessionIdentityPosture = ({ session, user }) => {
  if (!session?.user?.email || !user) {
    return {
      valid: false,
      reason: 'missing_user'
    }
  }

  if (session.user.id && session.user.id !== user.id) {
    return {
      valid: false,
      reason: 'user_id_mismatch'
    }
  }

  if (session.user.email !== user.email) {
    return {
      valid: false,
      reason: 'email_mismatch'
    }
  }

  return {
    valid: true,
    reason: 'matched'
  }
}

export const requireFreshRouteSessionUser = ({ session, user }) => {
  const posture = getRouteSessionIdentityPosture({ session, user })

  if (!posture.valid) {
    throw createForbiddenError('Fresh authenticated session required')
  }

  return user
}

export const requireActiveApiUser = user => {
  if (!isActiveUser(user)) {
    throw createForbiddenError('Active account required')
  }

  return user
}
