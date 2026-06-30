import { getServerSession } from 'next-auth'
import { createAuthenticationError } from './api-core.mjs'
import { authOptions } from './auth'
import { getCurrentUser } from './ownership'
import {
  requireActiveApiUser,
  requireFreshRouteSessionUser
} from './route-auth-core.mjs'

export const requireRouteCurrentUser = async () => {
  const session = await getServerSession(authOptions)
  const user = await getCurrentUser(session)

  if (!user) {
    throw createAuthenticationError()
  }

  requireFreshRouteSessionUser({ session, user })

  return requireActiveApiUser(user)
}
