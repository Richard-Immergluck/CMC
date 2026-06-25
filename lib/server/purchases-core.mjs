import { getPaymentIntentId, isPaidCheckoutSession } from './webhooks-core.mjs'

export const createCheckoutSessionReconciler = ({
  findOrderByCheckoutSession,
  fulfilPaidOrder,
  recordPaymentEvent,
  retrieveCheckoutSession
}) => async ({ checkoutSessionId, user }) => {
  const order = await findOrderByCheckoutSession(checkoutSessionId)

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

  const checkoutSession = await retrieveCheckoutSession(checkoutSessionId)

  if (!isPaidCheckoutSession(checkoutSession)) {
    return {
      status: 'unpaid',
      orderId: order.id
    }
  }

  const fulfilledOrder = await fulfilPaidOrder({
    checkoutSessionId,
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
