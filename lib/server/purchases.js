import { buildStripeLineItems } from './orders-core.mjs'
import { auditActions } from './audit-core.mjs'
import { recordAuditEvent } from './audit'
import {
  createPendingOrder,
  markOrderCheckoutSession
} from './orders'
import { getStripe } from './stripe'
import {
  fulfilPaidOrder,
  findOrderByCheckoutSession,
  recordPaymentEvent
} from './orders'
import { createCheckoutSessionReconciler } from './purchases-core.mjs'

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
    success_url: `${applicationUrl}/profile?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
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

  await recordAuditEvent({
    action: auditActions.checkoutCreated,
    actorId: user.id,
    entityType: 'Order',
    entityId: order.id,
    metadata: {
      amountTotal: order.amountTotal,
      currency: order.currency,
      stripeCheckoutSession: checkoutSession.id,
      trackIds
    }
  })

  return checkoutSession
}

export const reconcileCheckoutSession = async ({
  checkoutSessionId,
  user,
  stripe = getStripe()
}) => {
  return createCheckoutSessionReconciler({
    findOrderByCheckoutSession,
    fulfilPaidOrder,
    recordPaymentEvent,
    retrieveCheckoutSession: sessionId => stripe.checkout.sessions.retrieve(sessionId)
  })({
    checkoutSessionId,
    user
  })
}
