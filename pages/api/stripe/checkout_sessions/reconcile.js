import {
  handleApiError,
  createValidationError,
  requireCurrentUser,
  requireMethod,
  sendJson
} from '../../../../lib/server/api'
import { reconcileCheckoutSession } from '../../../../lib/server/purchases'
import { getOrCreateRequestId, logServerEvent } from '../../../../lib/server/logging'

const getCheckoutSessionId = req => {
  const sessionId = req.body?.sessionId

  if (!sessionId) {
    return null
  }

  if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    throw createValidationError('Valid checkout session id is required')
  }

  return sessionId
}

export default async function handler(req, res) {
  const requestId = getOrCreateRequestId(req)

  try {
    requireMethod(req, res, ['POST'])

    const user = await requireCurrentUser(req, res)
    const sessionId = getCheckoutSessionId(req)
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
