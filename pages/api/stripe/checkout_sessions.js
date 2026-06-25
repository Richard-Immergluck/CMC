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

export default async function handler(req, res) {
  const requestId = getOrCreateRequestId(req)

  try {
    requireMethod(req, res, ['POST'])

    const user = await requireCurrentUser(req)
    const { trackIds } = validateInput(
      checkoutSessionBodySchema,
      req.body,
      'Invalid checkout request'
    )

    const checkoutSession = await createCheckoutSessionForTracks({
      user,
      trackIds,
      applicationUrl: getApplicationBaseUrl(req)
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
