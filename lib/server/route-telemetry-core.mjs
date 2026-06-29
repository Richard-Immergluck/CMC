const elapsedMs = (now, startedAt) => Math.max(0, now() - startedAt)

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
    fail: (error, failureMetadata = {}) => logger({
      level: 'error',
      event: `${event}.failed`,
      message: `${route} failed`,
      requestId,
      metadata: {
        ...baseMetadata,
        ...failureMetadata,
        durationMs: elapsedMs(now, startedAt),
        errorName: error?.name,
        errorMessage: error?.message
      }
    })
  }
}
