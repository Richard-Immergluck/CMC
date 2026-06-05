import { buffer } from 'micro'
import {
  findOrderByCheckoutSession,
  fulfilPaidOrder,
  hasProcessedPaymentEvent,
  recordPaymentEvent
} from '../../../lib/server/orders'
import { getStripe } from '../../../lib/server/stripe'

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

  if (await hasProcessedPaymentEvent(event.id)) {
    return res.status(200).json({ received: true })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const checkoutSession = event.data.object
      const order = await findOrderByCheckoutSession(checkoutSession.id)

      if (!order) {
        await recordPaymentEvent({
          stripeEvent: event
        })

        return res.status(200).json({ received: true })
      }

      if (checkoutSession.payment_status === 'paid') {
        const fulfilledOrder = await fulfilPaidOrder({
          checkoutSessionId: checkoutSession.id,
          paymentIntentId: checkoutSession.payment_intent
        })

        await recordPaymentEvent({
          stripeEvent: event,
          orderId: fulfilledOrder.id
        })
      } else {
        await recordPaymentEvent({
          stripeEvent: event,
          orderId: order?.id
        })
      }
    } else {
      const checkoutSessionId = event.data?.object?.id
      const order = checkoutSessionId
        ? await findOrderByCheckoutSession(checkoutSessionId)
        : null

      await recordPaymentEvent({
        stripeEvent: event,
        orderId: order?.id
      })
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
