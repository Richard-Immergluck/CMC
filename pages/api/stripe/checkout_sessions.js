import {
  handleApiError,
  requireCurrentUser,
  requireMethod,
  sendJson
} from '../../../lib/server/api'
import { createCheckoutSessionForTracks } from '../../../lib/server/purchases'
import { getOrCreateRequestId, logServerEvent } from '../../../lib/server/logging'
import { getApplicationBaseUrl } from '../../../lib/server/url'
import {
  checkoutSessionBodySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

const e2eCheckoutModes = new Set(['cancel', 'unpaid'])

const getE2ECheckoutMode = req => {
  if (
    process.env.CMC_ENABLE_E2E_STRIPE !== 'true' ||
    process.env.VERCEL_ENV === 'production'
  ) {
    return null
  }

  const mode = req.headers['x-cmc-e2e-checkout-mode']
  return e2eCheckoutModes.has(mode) ? mode : null
}

export default async function handler(req, res) {
  const requestId = getOrCreateRequestId(req)

  try {
    requireMethod(req, res, ['POST'])

    const user = await requireCurrentUser(req, res)
    const { trackIds } = validateInput(
      checkoutSessionBodySchema,
      req.body,
      'Invalid checkout request'
    )

    const checkoutSession = await createCheckoutSessionForTracks({
      user,
      trackIds,
      applicationUrl: getApplicationBaseUrl(req),
      e2eCheckoutMode: getE2ECheckoutMode(req)
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

    return sendJson(res, 200, { url: checkoutSession.url })
  } catch (error) {
    return handleApiError(res, error, req)
  }
}
