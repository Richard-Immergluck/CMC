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
  findLatestPendingOrderForUser,
  findOrderByCheckoutSession,
  recordPaymentEvent
} from './orders'
import { getPaymentIntentId, isPaidCheckoutSession } from './webhooks-core.mjs'

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
  const order = checkoutSessionId
    ? await findOrderByCheckoutSession(checkoutSessionId)
    : await findLatestPendingOrderForUser(user.id)

  if (!order || order.userId !== user.id) {
    return {
      status: 'not_found',
      orderId: null
    }
  }

  if (order.status === 'PAID') {
    return {
      status: 'already_fulfilled',
      orderId: order.id
    }
  }

  const resolvedCheckoutSessionId = checkoutSessionId || order.stripeCheckoutSession
  const checkoutSession = await stripe.checkout.sessions.retrieve(resolvedCheckoutSessionId)

  if (!isPaidCheckoutSession(checkoutSession)) {
    return {
      status: 'unpaid',
      orderId: order.id
    }
  }

  const fulfilledOrder = await fulfilPaidOrder({
    checkoutSessionId: resolvedCheckoutSessionId,
    paymentIntentId: getPaymentIntentId(checkoutSession)
  })

  await recordPaymentEvent({
    stripeEvent: {
      id: `checkout_session_reconciled:${checkoutSession.id}`,
      type: 'checkout.session.reconciled',
      data: {
        object: checkoutSession
      }
    },
    orderId: fulfilledOrder.id
  })

  return {
    status: 'fulfilled',
    orderId: fulfilledOrder.id
  }
}
