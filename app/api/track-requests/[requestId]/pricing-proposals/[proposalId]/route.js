import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod,
  requireTrustedRouteOrigin
} from '../../../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../../../lib/server/route-auth'
import { enforceRouteRateLimit } from '../../../../../../lib/server/rate-limit'
import { createRouteTelemetry } from '../../../../../../lib/server/route-telemetry'
import { decideRequestPricingProposal } from '../../../../../../lib/server/request-pricing.mjs'
import {
  positiveIntegerParamSchema,
  trackRequestPricingDecisionBodySchema,
  validateInput
} from '../../../../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['PATCH'])
const routePath = '/api/track-requests/[requestId]/pricing-proposals/[proposalId]'

export async function PATCH(request, { params }) {
  const telemetry = createRouteTelemetry({
    request,
    route: routePath,
    event: 'track_request.pricing_proposal.decision'
  })

  try {
    requireRouteMethod(request, ['PATCH'])
    requireTrustedRouteOrigin(request)
    const user = await requireRouteCurrentUser()
    await enforceRouteRateLimit({
      request,
      scope: 'track_request.pricing_proposal.decision',
      userId: user.id,
      limit: 30,
      windowMs: 5 * 60 * 1000,
      audit: {
        actorId: user.id,
        route: routePath
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
    const { id: proposalId } = validateInput(
      positiveIntegerParamSchema,
      {
        id: resolvedParams?.proposalId
      },
      'Invalid pricing proposal id'
    )
    const body = await parseRouteJson(request)
    const input = validateInput(
      trackRequestPricingDecisionBodySchema,
      body,
      'Invalid request pricing decision'
    )
    const proposal = await decideRequestPricingProposal({
      input,
      proposalId,
      requestId,
      user
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      requestId,
      proposalId,
      requesterDecision: proposal.requesterDecision
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
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
