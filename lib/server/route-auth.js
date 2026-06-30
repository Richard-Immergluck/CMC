import { getServerSession } from 'next-auth'
import { createAuthenticationError } from './api-core.mjs'
import { authOptions } from './auth'
import { getCurrentUser } from './ownership'
import { safelyRecordInactiveApiUserRejection } from './route-auth-audit'
import {
  getActiveApiUserPosture,
  requireActiveApiUser,
  requireFreshRouteSessionUser
} from './route-auth-core.mjs'

export const requireRouteCurrentUser = async ({ route } = {}) => {
  const session = await getServerSession(authOptions)
  const user = await getCurrentUser(session)

  if (!user) {
    throw createAuthenticationError()
  }

  requireFreshRouteSessionUser({ session, user })

  const activePosture = getActiveApiUserPosture(user)

  if (activePosture.reason === 'inactive_account') {
    await safelyRecordInactiveApiUserRejection({
      reason: activePosture.reason,
      route,
      user
    })
  }

  return requireActiveApiUser(user)
}
