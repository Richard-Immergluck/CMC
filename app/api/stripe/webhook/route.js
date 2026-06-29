import {
  createMethodNotAllowedHandler,
  jsonResponse
} from '../../../../lib/server/route-handlers'
import { logServerEvent } from '../../../../lib/server/logging'
import { createRouteTelemetry } from '../../../../lib/server/route-telemetry'
import { getStripe } from '../../../../lib/server/stripe'
import { processStripeWebhookEvent } from '../../../../lib/server/webhooks'

export const runtime = 'nodejs'

const methodNotAllowed = createMethodNotAllowedHandler(['POST'])

export async function POST(request) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/stripe/webhook',
    event: 'stripe.webhook'
  })
  const { requestId } = telemetry
  const responseHeaders = {
    'X-Request-Id': requestId
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    telemetry.complete({
      statusCode: 500,
      outcome: 'missing_webhook_secret'
    })

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

    telemetry.complete({
      statusCode: 400,
      outcome: 'signature_failed'
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

    telemetry.complete({
      statusCode: 200,
      stripeEventId: event.id,
      stripeEventType: event.type,
      status: result.status,
      orderId: result.orderId
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

    telemetry.fail(error, {
      statusCode: 500,
      stripeEventId: event.id,
      stripeEventType: event.type
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
