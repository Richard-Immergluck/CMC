import { buffer } from 'micro'
import { getStripe } from '../../../lib/server/stripe'
import { processStripeWebhookEvent } from '../../../lib/server/webhooks'

export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(req, res) {
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
    return res.status(400).json({ message: `Webhook signature failed: ${error.message}` })
  }

  try {
    const result = await processStripeWebhookEvent(event)

    return res.status(200).json({ received: true, status: result.status })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
