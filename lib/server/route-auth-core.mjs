import { createForbiddenError } from './api-core.mjs'
import { isActiveUser } from './permissions.mjs'

export const requireActiveApiUser = user => {
  if (!isActiveUser(user)) {
    throw createForbiddenError('Active account required')
  }

  return user
}
