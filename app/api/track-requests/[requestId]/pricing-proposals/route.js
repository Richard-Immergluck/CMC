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
import { createRequestPricingProposal } from '../../../../../lib/server/request-pricing.mjs'
import {
  positiveIntegerParamSchema,
  trackRequestPricingProposalBodySchema,
  validateInput
} from '../../../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['POST'])

export async function POST(request, { params }) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/track-requests/[requestId]/pricing-proposals',
    event: 'track_request.pricing_proposal.create'
  })

  try {
    requireRouteMethod(request, ['POST'])
    requireTrustedRouteOrigin(request)
    const user = await requireRouteCurrentUser()
    await enforceRouteRateLimit({
      request,
      scope: 'track_request.pricing_proposal.create',
      userId: user.id,
      limit: 30,
      windowMs: 5 * 60 * 1000,
      audit: {
        actorId: user.id,
        route: '/api/track-requests/[requestId]/pricing-proposals'
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
      trackRequestPricingProposalBodySchema,
      body,
      'Invalid request pricing proposal'
    )
    const proposal = await createRequestPricingProposal({
      input,
      requestId,
      user
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      requestId,
      proposalId: proposal.id,
      reviewStatus: proposal.reviewStatus
    })

    return jsonResponse(200, proposal)
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
