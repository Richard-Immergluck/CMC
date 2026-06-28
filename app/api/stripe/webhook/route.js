import {
  createMethodNotAllowedHandler,
  getRouteRequestId,
  jsonResponse
} from '../../../../lib/server/route-handlers'
import { logServerEvent } from '../../../../lib/server/logging'
import { getStripe } from '../../../../lib/server/stripe'
import { processStripeWebhookEvent } from '../../../../lib/server/webhooks'

export const runtime = 'nodejs'

const methodNotAllowed = createMethodNotAllowedHandler(['POST'])

export async function POST(request) {
  const requestId = getRouteRequestId(request)
  const responseHeaders = {
    'X-Request-Id': requestId
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return jsonResponse(500, { message: 'Missing STRIPE_WEBHOOK_SECRET' }, responseHeaders)
  }

  const stripe = getStripe()
  const signature = request.headers.get('stripe-signature')
  const rawBody = await request.text()
  let event

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    logServerEvent({
      level: 'warn',
      event: 'stripe.webhook_signature_failed',
      message: 'Stripe webhook signature verification failed',
      requestId,
      metadata: {
        error: error.message
      }
    })

    return jsonResponse(400, { message: `Webhook signature failed: ${error.message}` }, responseHeaders)
  }

  try {
    const result = await processStripeWebhookEvent(event)

    logServerEvent({
      event: 'stripe.webhook_processed',
      message: 'Stripe webhook processed',
      requestId,
      metadata: {
        stripeEventId: event.id,
        stripeEventType: event.type,
        status: result.status,
        orderId: result.orderId
      }
    })

    return jsonResponse(200, { received: true, status: result.status }, responseHeaders)
  } catch (error) {
    logServerEvent({
      level: 'error',
      event: 'stripe.webhook_processing_failed',
      message: 'Stripe webhook processing failed',
      requestId,
      metadata: {
        stripeEventId: event.id,
        stripeEventType: event.type,
        error: error.message
      }
    })

    return jsonResponse(500, { message: error.message, requestId }, responseHeaders)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as GET,
  methodNotAllowed as PATCH,
  methodNotAllowed as PUT
}
