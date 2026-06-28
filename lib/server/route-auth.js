import { getServerSession } from 'next-auth'
import { createAuthenticationError } from './api-core.mjs'
import { authOptions } from './auth'
import { getCurrentUser } from './ownership'

export const requireRouteCurrentUser = async () => {
  const session = await getServerSession(authOptions)
  const user = await getCurrentUser(session)

  if (!user) {
    throw createAuthenticationError()
  }

  return user
}
