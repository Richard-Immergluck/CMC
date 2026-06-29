const sensitiveKeyPattern = /(authorization|cookie|password|secret|token|key|credential)/i
const requestIdPattern = /^[A-Za-z0-9._:-]{1,128}$/

export const createRequestId = (crypto = globalThis.crypto || {}) => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const normalizeRequestId = value => {
  const requestId = Array.isArray(value) ? value[0] : value

  if (typeof requestId !== 'string') {
    return undefined
  }

  const trimmedRequestId = requestId.trim()

  if (!requestIdPattern.test(trimmedRequestId)) {
    return undefined
  }

  return trimmedRequestId
}

export const getRequestId = req => {
  const headerValue = req?.headers?.['x-request-id'] || req?.headers?.['x-correlation-id']
  const requestId = normalizeRequestId(headerValue)

  return requestId || createRequestId()
}

export const redactLogMetadata = metadata => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return metadata
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      sensitiveKeyPattern.test(key) ? '[REDACTED]' : value
    ])
  )
}

export const createLogEntry = ({ level, event, message, requestId, metadata }) => ({
  level,
  event,
  message,
  requestId,
  metadata: redactLogMetadata(metadata),
  timestamp: new Date().toISOString()
})
