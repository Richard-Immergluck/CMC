const sensitiveKeyPattern = /(authorization|cookie|password|secret|token|key|credential)/i

export const createRequestId = ({ randomUUID } = globalThis.crypto || {}) => {
  if (typeof randomUUID === 'function') {
    return randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const getRequestId = req => {
  const headerValue = req?.headers?.['x-request-id'] || req?.headers?.['x-correlation-id']
  const requestId = Array.isArray(headerValue) ? headerValue[0] : headerValue

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
