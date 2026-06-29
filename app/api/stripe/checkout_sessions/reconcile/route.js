import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod
} from '../../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../../lib/server/route-auth'
import { reconcileCheckoutSession } from '../../../../../lib/server/purchases'
import { logServerEvent } from '../../../../../lib/server/logging'
import { enforceRouteRateLimit } from '../../../../../lib/server/rate-limit'
import { createRouteTelemetry } from '../../../../../lib/server/route-telemetry'
import {
  reconcileCheckoutSessionBodySchema,
  validateInput
} from '../../../../../lib/validation/api.mjs'

export const runtime = 'nodejs'

const methodNotAllowed = createMethodNotAllowedHandler(['POST'])

export async function POST(request) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/stripe/checkout_sessions/reconcile',
    event: 'checkout.reconcile'
  })
  const { requestId } = telemetry

  try {
    requireRouteMethod(request, ['POST'])

    const user = await requireRouteCurrentUser()
    enforceRouteRateLimit({
      request,
      scope: 'checkout.reconcile',
      userId: user.id,
      limit: 30,
      windowMs: 5 * 60 * 1000
    })
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

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      stripeCheckoutSession: sessionId,
      status: result.status,
      orderId: result.orderId
    })

    return jsonResponse(200, result)
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
