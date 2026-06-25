import { buffer } from 'micro'
import { getOrCreateRequestId, logServerEvent } from '../../../lib/server/logging'
import { getStripe } from '../../../lib/server/stripe'
import { processStripeWebhookEvent } from '../../../lib/server/webhooks'

export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(req, res) {
  const requestId = getOrCreateRequestId(req)
  res.setHeader('X-Request-Id', requestId)

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ message: 'Missing STRIPE_WEBHOOK_SECRET' })
  }

  const stripe = getStripe()
  const signature = req.headers['stripe-signature']
  const rawBody = await buffer(req)

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

    return res.status(400).json({ message: `Webhook signature failed: ${error.message}` })
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

    return res.status(200).json({ received: true, status: result.status })
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

    return res.status(500).json({ message: error.message, requestId })
  }
}
