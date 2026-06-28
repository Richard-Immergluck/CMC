import {
  createMethodNotAllowedHandler,
  getRouteRequestId,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod
} from '../../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../../lib/server/route-auth'
import { reconcileCheckoutSession } from '../../../../../lib/server/purchases'
import { logServerEvent } from '../../../../../lib/server/logging'
import {
  reconcileCheckoutSessionBodySchema,
  validateInput
} from '../../../../../lib/validation/api.mjs'

export const runtime = 'nodejs'

const methodNotAllowed = createMethodNotAllowedHandler(['POST'])

export async function POST(request) {
  const requestId = getRouteRequestId(request)

  try {
    requireRouteMethod(request, ['POST'])

    const user = await requireRouteCurrentUser()
    const body = await parseRouteJson(request)
    const { sessionId = null } = validateInput(
      reconcileCheckoutSessionBodySchema,
      body,
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

    return jsonResponse(200, result)
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
