import { createTooManyRequestsError } from './api-core.mjs'
import {
  auditActions,
  buildRateLimitExceededMetadata
} from './audit-core.mjs'
import { recordAuditEvent } from './audit'
import { logServerEvent } from './logging'
import {
  checkRateLimit,
  checkSharedRateLimit,
  createRateLimitHeaders,
  createRateLimitKey,
  isSharedRateLimitConfigured
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
  windowMs,
  audit
}) => enforceRouteRateLimitAsync({
  request,
  scope,
  userId,
  limit,
  windowMs,
  audit
})

export const enforceRouteRateLimitAsync = async ({
  request,
  scope,
  userId,
  limit,
  windowMs,
  audit
}) => {
  const key = createRateLimitKey({ scope, request, userId })
  let result

  if (isSharedRateLimitConfigured()) {
    try {
      result = await checkSharedRateLimit({
        key,
        limit,
        windowMs
      })
    } catch (error) {
      logServerEvent({
        level: 'warn',
        event: 'rate_limit.shared_store_failed',
        message: 'Shared rate-limit store failed; falling back to local limiter',
        metadata: {
          scope,
          errorName: error.name
        }
      })
    }
  }

  if (!result) {
    result = checkRateLimit({
      store: getRateLimitStore(),
      key,
      limit,
      windowMs
    })
  }

  if (!result.allowed) {
    if (audit?.actorId) {
      recordAuditEvent({
        action: auditActions.rateLimitExceeded,
        actorId: audit.actorId,
        entityType: audit.entityType || 'User',
        entityId: audit.entityId || audit.actorId,
        metadata: buildRateLimitExceededMetadata({
          limit: result.limit,
          remaining: result.remaining,
          resetAt: result.resetAt,
          route: audit.route,
          scope
        })
      }).catch(error => {
        logServerEvent({
          level: 'warn',
          event: 'audit.rate_limit_exceeded_failed',
          message: 'Failed to record rate-limit audit event',
          metadata: {
            route: audit.route,
            scope,
            errorName: error.name
          }
        })
      })
    }

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
