export const getRateLimitClientIp = request => {
  const forwardedFor = request?.headers?.get?.('x-forwarded-for')

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  return request?.headers?.get?.('x-real-ip') ||
    request?.headers?.get?.('cf-connecting-ip') ||
    'unknown'
}

export const createRateLimitKey = ({ scope, request, userId }) => {
  const actor = userId || getRateLimitClientIp(request)
  return `${scope}:${actor}`
}

export const checkRateLimit = ({
  store,
  key,
  limit,
  windowMs,
  now = Date.now
}) => {
  const currentTime = now()
  const existing = store.get(key)

  if (!existing || existing.resetAt <= currentTime) {
    const entry = {
      count: 1,
      resetAt: currentTime + windowMs
    }
    store.set(key, entry)

    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt: entry.resetAt,
      retryAfterSeconds: 0
    }
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - currentTime) / 1000))
    }
  }

  existing.count += 1

  return {
    allowed: true,
    limit,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
    retryAfterSeconds: 0
  }
}

export const createRateLimitHeaders = result => ({
  'X-RateLimit-Limit': String(result.limit),
  'X-RateLimit-Remaining': String(result.remaining),
  'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  ...(result.retryAfterSeconds > 0 ? { 'Retry-After': String(result.retryAfterSeconds) } : {})
})
