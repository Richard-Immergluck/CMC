import { getRouteRequestId } from './route-handlers.js'
import { logServerEvent } from './logging.js'
import { createRouteTelemetryCore } from './route-telemetry-core.mjs'

export const createRouteTelemetry = ({
  request,
  route,
  event,
  metadata = {},
  logger = logServerEvent,
  now = Date.now
}) => {
  const requestId = getRouteRequestId(request)
  return createRouteTelemetryCore({
    requestId,
    method: request?.method,
    route,
    event,
    metadata,
    logger,
    now
  })
}
