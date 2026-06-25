import { getPaymentIntentId, isPaidCheckoutSession } from './webhooks-core.mjs'

export const createCheckoutSessionReconciler = ({
  findLatestPendingOrderForUser,
  findOrderByCheckoutSession,
  fulfilPaidOrder,
  recordPaymentEvent,
  retrieveCheckoutSession
}) => async ({ checkoutSessionId, user }) => {
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
  const checkoutSession = await retrieveCheckoutSession(resolvedCheckoutSessionId)

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
