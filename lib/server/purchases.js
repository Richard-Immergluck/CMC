import { buildStripeLineItems } from './orders-core.mjs'
import {
  createPendingOrder,
  markOrderCheckoutSession
} from './orders'
import { getStripe } from './stripe'

export const createCheckoutSessionForTracks = async ({
  user,
  trackIds,
  applicationUrl,
  stripe = getStripe()
}) => {
  const order = await createPendingOrder({
    user,
    trackIds
  })

  const checkoutSession = await stripe.checkout.sessions.create({
    line_items: buildStripeLineItems(order.items),
    mode: 'payment',
    success_url: `${applicationUrl}/profile?checkout=success`,
    cancel_url: `${applicationUrl}/cart?checkout=canceled`,
    client_reference_id: `${order.id}`,
    metadata: {
      orderId: `${order.id}`
    }
  })

  await markOrderCheckoutSession({
    orderId: order.id,
    checkoutSessionId: checkoutSession.id
  })

  return checkoutSession
}

