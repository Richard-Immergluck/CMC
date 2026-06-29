import { createTooManyRequestsError } from './api-core.mjs'
import {
  checkRateLimit,
  createRateLimitHeaders,
  createRateLimitKey
} from './rate-limit-core.mjs'

const globalForRateLimit = global

const getRateLimitStore = () => {
  if (!globalForRateLimit.cmcRateLimitStore) {
    globalForRateLimit.cmcRateLimitStore = new Map()
  }

  return globalForRateLimit.cmcRateLimitStore
}

export const enforceRouteRateLimit = ({
  request,
  scope,
  userId,
  limit,
  windowMs
}) => {
  const result = checkRateLimit({
    store: getRateLimitStore(),
    key: createRateLimitKey({ scope, request, userId }),
    limit,
    windowMs
  })

  if (!result.allowed) {
    const error = createTooManyRequestsError({
      retryAfterSeconds: result.retryAfterSeconds
    })
    error.headers = {
      ...error.headers,
      ...createRateLimitHeaders(result)
    }
    throw error
  }

  return result
}
