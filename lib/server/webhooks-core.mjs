export const supportedStripeWebhookEvents = ['checkout.session.completed']

export const getStripeObjectId = stripeEvent => stripeEvent.data?.object?.id || null

export const getCheckoutSessionId = stripeEvent => {
  if (stripeEvent.type === 'checkout.session.completed') {
    return getStripeObjectId(stripeEvent)
  }

  return null
}

export const isSupportedStripeWebhookEvent = stripeEvent => {
  return supportedStripeWebhookEvents.includes(stripeEvent.type)
}

export const isPaidCheckoutSession = checkoutSession => checkoutSession.payment_status === 'paid'

export const getPaymentIntentId = checkoutSession => {
  if (!checkoutSession.payment_intent) {
    return undefined
  }

  return typeof checkoutSession.payment_intent === 'string'
    ? checkoutSession.payment_intent
    : checkoutSession.payment_intent.id
}

export const describeStripeWebhookEvent = stripeEvent => {
  return {
    id: stripeEvent.id,
    type: stripeEvent.type,
    supported: isSupportedStripeWebhookEvent(stripeEvent),
    checkoutSessionId: getCheckoutSessionId(stripeEvent)
  }
}

export const createStripeWebhookProcessor = ({
  findOrderByCheckoutSession,
  fulfilPaidOrder,
  hasProcessedPaymentEvent,
  recordPaymentEvent
}) => async stripeEvent => {
  if (await hasProcessedPaymentEvent(stripeEvent.id)) {
    return {
      status: 'duplicate',
      orderId: null
    }
  }

  if (!isSupportedStripeWebhookEvent(stripeEvent)) {
    await recordPaymentEvent({
      stripeEvent
    })

    return {
      status: 'ignored',
      orderId: null
    }
  }

  const checkoutSession = stripeEvent.data.object
  const checkoutSessionId = getCheckoutSessionId(stripeEvent)
  const order = checkoutSessionId
    ? await findOrderByCheckoutSession(checkoutSessionId)
    : null

  if (!order) {
    await recordPaymentEvent({
      stripeEvent
    })

    return {
      status: 'unknown_order',
      orderId: null
    }
  }

  if (!isPaidCheckoutSession(checkoutSession)) {
    await recordPaymentEvent({
      stripeEvent,
      orderId: order.id
    })

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
    stripeEvent,
    orderId: fulfilledOrder.id
  })

  return {
    status: 'fulfilled',
    orderId: fulfilledOrder.id
  }
}
