import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod,
  requireTrustedRouteOrigin
} from '../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../lib/server/route-auth'
import { createCheckoutSessionForTracks } from '../../../../lib/server/purchases'
import { logServerEvent } from '../../../../lib/server/logging'
import { enforceRouteRateLimit } from '../../../../lib/server/rate-limit'
import { createRouteTelemetry } from '../../../../lib/server/route-telemetry'
import { getApplicationBaseUrl } from '../../../../lib/server/url'
import {
  checkoutSessionBodySchema,
  validateInput
} from '../../../../lib/validation/api.mjs'

export const runtime = 'nodejs'

const methodNotAllowed = createMethodNotAllowedHandler(['POST'])
const e2eCheckoutModes = new Set(['cancel', 'unpaid'])

const toLegacyRequestHeaders = request => ({
  headers: Object.fromEntries(request.headers.entries())
})

const getE2ECheckoutMode = request => {
  if (
    process.env.CMC_ENABLE_E2E_STRIPE !== 'true' ||
    process.env.VERCEL_ENV === 'production'
  ) {
    return null
  }

  const mode = request.headers.get('x-cmc-e2e-checkout-mode')
  return e2eCheckoutModes.has(mode) ? mode : null
}

export async function POST(request) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/stripe/checkout_sessions',
    event: 'checkout.session'
  })
  const { requestId } = telemetry

  try {
    requireRouteMethod(request, ['POST'])
    requireTrustedRouteOrigin(request)

    const user = await requireRouteCurrentUser()
    enforceRouteRateLimit({
      request,
      scope: 'checkout.session',
      userId: user.id,
      limit: 12,
      windowMs: 5 * 60 * 1000,
      audit: {
        actorId: user.id,
        route: '/api/stripe/checkout_sessions'
      }
    })
    const body = await parseRouteJson(request)
    const { trackIds } = validateInput(
      checkoutSessionBodySchema,
      body,
      'Invalid checkout request'
    )

    const checkoutSession = await createCheckoutSessionForTracks({
      user,
      trackIds,
      applicationUrl: getApplicationBaseUrl(toLegacyRequestHeaders(request)),
      e2eCheckoutMode: getE2ECheckoutMode(request)
    })

    logServerEvent({
      event: 'checkout.session_created',
      message: 'Stripe checkout session created',
      requestId,
      metadata: {
        userId: user.id,
        trackCount: trackIds.length,
        stripeCheckoutSession: checkoutSession.id
      }
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      trackCount: trackIds.length,
      stripeCheckoutSession: checkoutSession.id
    })

    return jsonResponse(200, { url: checkoutSession.url })
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
