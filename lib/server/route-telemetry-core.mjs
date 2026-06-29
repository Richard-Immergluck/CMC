const elapsedMs = (now, startedAt) => Math.max(0, now() - startedAt)

export const getRouteFailureLevel = error => {
  const statusCode = error?.statusCode

  if (Number.isInteger(statusCode) && statusCode < 500) {
    return 'warn'
  }

  return 'error'
}

export const createRouteTelemetryCore = ({
  requestId,
  method,
  route,
  event,
  metadata = {},
  logger,
  now = Date.now
}) => {
  const startedAt = now()
  const baseMetadata = {
    route,
    method,
    ...metadata
  }

  logger({
    event: `${event}.started`,
    message: `${route} started`,
    requestId,
    metadata: baseMetadata
  })

  return {
    requestId,
    complete: (completionMetadata = {}) => logger({
      event: `${event}.completed`,
      message: `${route} completed`,
      requestId,
      metadata: {
        ...baseMetadata,
        ...completionMetadata,
        durationMs: elapsedMs(now, startedAt)
      }
    }),
    fail: (error, failureMetadata = {}) => {
      const statusCode = failureMetadata.statusCode ?? error?.statusCode

      logger({
        level: getRouteFailureLevel({ ...error, statusCode }),
        event: `${event}.failed`,
        message: `${route} failed`,
        requestId,
        metadata: {
          ...baseMetadata,
          ...failureMetadata,
          ...(statusCode ? { statusCode } : {}),
          durationMs: elapsedMs(now, startedAt),
          errorName: error?.name,
          errorMessage: error?.message
        }
      })
    }
  }
}
