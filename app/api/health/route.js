import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  requireRouteMethod
} from '../../../lib/server/route-handlers'
import { createRouteTelemetry } from '../../../lib/server/route-telemetry'
import { buildShallowHealth } from '../../../lib/server/health-core.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['GET'])

export async function GET(request) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/health',
    event: 'health.shallow'
  })

  try {
    requireRouteMethod(request, ['GET'])
    const body = buildShallowHealth()

    telemetry.complete({
      statusCode: 200,
      healthStatus: body.status
    })

    return jsonResponse(200, body, {
      'X-Request-Id': telemetry.requestId
    })
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as PATCH,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
