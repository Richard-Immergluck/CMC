import {
  handleApiError,
  requireCurrentUser,
  requireMethod,
  sendJson
} from '../../../../lib/server/api'
import { reconcileCheckoutSession } from '../../../../lib/server/purchases'
import { getOrCreateRequestId, logServerEvent } from '../../../../lib/server/logging'
import {
  reconcileCheckoutSessionBodySchema,
  validateInput
} from '../../../../lib/validation/api.mjs'

export default async function handler(req, res) {
  const requestId = getOrCreateRequestId(req)

  try {
    requireMethod(req, res, ['POST'])

    const user = await requireCurrentUser(req, res)
    const { sessionId = null } = validateInput(
      reconcileCheckoutSessionBodySchema,
      req.body,
      'Invalid checkout reconciliation request'
    )
    const result = await reconcileCheckoutSession({
      checkoutSessionId: sessionId,
      user
    })

    logServerEvent({
      event: 'checkout.session_reconciled',
      message: 'Stripe checkout session reconciled from success return',
      requestId,
      metadata: {
        userId: user.id,
        stripeCheckoutSession: sessionId,
        status: result.status,
        orderId: result.orderId
      }
    })

    return sendJson(res, 200, result)
  } catch (error) {
    return handleApiError(res, error, req)
  }
}
