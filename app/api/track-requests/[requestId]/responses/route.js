import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod,
  requireTrustedRouteOrigin
} from '../../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../../lib/server/route-auth'
import { enforceRouteRateLimit } from '../../../../../lib/server/rate-limit'
import { createRouteTelemetry } from '../../../../../lib/server/route-telemetry'
import { upsertTrackRequestResponse } from '../../../../../lib/server/request-responses.mjs'
import {
  positiveIntegerParamSchema,
  trackRequestResponseBodySchema,
  validateInput
} from '../../../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['POST'])

export async function POST(request, { params }) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/track-requests/[requestId]/responses',
    event: 'track_request.response.upsert'
  })

  try {
    requireRouteMethod(request, ['POST'])
    requireTrustedRouteOrigin(request)
    const user = await requireRouteCurrentUser()
    await enforceRouteRateLimit({
      request,
      scope: 'track_request.response.upsert',
      userId: user.id,
      limit: 30,
      windowMs: 5 * 60 * 1000,
      audit: {
        actorId: user.id,
        route: '/api/track-requests/[requestId]/responses'
      }
    })

    const resolvedParams = await params
    const { id: requestId } = validateInput(
      positiveIntegerParamSchema,
      {
        id: resolvedParams?.requestId
      },
      'Invalid track request id'
    )
    const body = await parseRouteJson(request)
    const input = validateInput(
      trackRequestResponseBodySchema,
      body,
      'Invalid request response'
    )
    const response = await upsertTrackRequestResponse({
      input,
      requestId,
      user
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      requestId,
      responseId: response.id,
      responseStatus: response.status
    })

    return jsonResponse(200, response)
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as GET,
  methodNotAllowed as PATCH,
  methodNotAllowed as PUT
}
