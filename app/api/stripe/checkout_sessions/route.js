import {
  createMethodNotAllowedHandler,
  getRouteRequestId,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod
} from '../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../lib/server/route-auth'
import { createCheckoutSessionForTracks } from '../../../../lib/server/purchases'
import { logServerEvent } from '../../../../lib/server/logging'
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
  const requestId = getRouteRequestId(request)

  try {
    requireRouteMethod(request, ['POST'])

    const user = await requireRouteCurrentUser()
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

    return jsonResponse(200, { url: checkoutSession.url })
  } catch (error) {
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as GET,
  methodNotAllowed as PATCH,
  methodNotAllowed as PUT
}
