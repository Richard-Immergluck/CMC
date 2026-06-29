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

export const isSharedRateLimitConfigured = ({
  url = process.env.UPSTASH_REDIS_REST_URL,
  token = process.env.UPSTASH_REDIS_REST_TOKEN
} = {}) => Boolean(url && token)

const toRedisRateLimitKey = key => `cmc:rate-limit:${key}`

const parseUpstashPipelineResults = payload => {
  const results = Array.isArray(payload) ? payload : payload?.result

  if (!Array.isArray(results) || results.length < 3) {
    throw new Error('Unexpected Upstash rate-limit response')
  }

  const count = Number(results[0]?.result)
  const ttlMs = Number(results[2]?.result)

  if (!Number.isFinite(count)) {
    throw new Error('Unexpected Upstash rate-limit count')
  }

  return {
    count,
    ttlMs: Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : null
  }
}

export const checkSharedRateLimit = async ({
  key,
  limit,
  windowMs,
  now = Date.now,
  fetchImpl = fetch,
  url = process.env.UPSTASH_REDIS_REST_URL,
  token = process.env.UPSTASH_REDIS_REST_TOKEN
}) => {
  if (!isSharedRateLimitConfigured({ url, token })) {
    throw new Error('Shared rate-limit store is not configured')
  }

  const currentTime = now()
  const redisKey = toRedisRateLimitKey(key)
  const response = await fetchImpl(`${url.replace(/\/+$/, '')}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([
      ['INCR', redisKey],
      ['EXPIRE', redisKey, Math.ceil(windowMs / 1000), 'NX'],
      ['PTTL', redisKey]
    ])
  })

  if (!response.ok) {
    throw new Error(`Shared rate-limit store returned HTTP ${response.status}`)
  }

  const { count, ttlMs } = parseUpstashPipelineResults(await response.json())
  const resetAt = currentTime + (ttlMs || windowMs)
  const allowed = count <= limit

  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt,
    retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((resetAt - currentTime) / 1000))
  }
}

export const createRateLimitHeaders = result => ({
  'X-RateLimit-Limit': String(result.limit),
  'X-RateLimit-Remaining': String(result.remaining),
  'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  ...(result.retryAfterSeconds > 0 ? { 'Retry-After': String(result.retryAfterSeconds) } : {})
})
