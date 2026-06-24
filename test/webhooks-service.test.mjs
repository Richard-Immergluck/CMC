import assert from 'node:assert/strict'
import test from 'node:test'
import { createStripeWebhookProcessor } from '../lib/server/webhooks-core.mjs'

const createTestProcessor = ({
  processed = false,
  order = { id: 123 },
  fulfilledOrder = { id: 123 }
} = {}) => {
  const calls = {
    findOrderByCheckoutSession: [],
    fulfilPaidOrder: [],
    hasProcessedPaymentEvent: [],
    recordPaymentEvent: []
  }

  const processStripeWebhookEvent = createStripeWebhookProcessor({
    findOrderByCheckoutSession: async checkoutSessionId => {
      calls.findOrderByCheckoutSession.push(checkoutSessionId)
      return order
    },
    fulfilPaidOrder: async args => {
      calls.fulfilPaidOrder.push(args)
      return fulfilledOrder
    },
    hasProcessedPaymentEvent: async stripeEventId => {
      calls.hasProcessedPaymentEvent.push(stripeEventId)
      return processed
    },
    recordPaymentEvent: async args => {
      calls.recordPaymentEvent.push(args)
      return { id: 1 }
    }
  })

  return {
    calls,
    processStripeWebhookEvent
  }
}

const checkoutCompletedEvent = ({
  id = 'evt_1',
  sessionId = 'cs_1',
  paymentStatus = 'paid',
  paymentIntent = 'pi_1'
} = {}) => ({
  id,
  type: 'checkout.session.completed',
  data: {
    object: {
      id: sessionId,
      payment_status: paymentStatus,
      payment_intent: paymentIntent
    }
  }
})

test('processStripeWebhookEvent exits early for duplicate events', async () => {
  const { calls, processStripeWebhookEvent } = createTestProcessor({
    processed: true
  })

  assert.deepEqual(await processStripeWebhookEvent(checkoutCompletedEvent()), {
    status: 'duplicate',
    orderId: null
  })
  assert.deepEqual(calls.recordPaymentEvent, [])
  assert.deepEqual(calls.fulfilPaidOrder, [])
})

test('processStripeWebhookEvent records unsupported events as ignored', async () => {
  const { calls, processStripeWebhookEvent } = createTestProcessor()
  const event = {
    id: 'evt_unsupported',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_1'
      }
    }
  }

  assert.deepEqual(await processStripeWebhookEvent(event), {
    status: 'ignored',
    orderId: null
  })
  assert.equal(calls.recordPaymentEvent.length, 1)
  assert.deepEqual(calls.fulfilPaidOrder, [])
})

test('processStripeWebhookEvent records checkout events with unknown orders', async () => {
  const { calls, processStripeWebhookEvent } = createTestProcessor({
    order: null
  })

  assert.deepEqual(await processStripeWebhookEvent(checkoutCompletedEvent()), {
    status: 'unknown_order',
    orderId: null
  })
  assert.deepEqual(calls.findOrderByCheckoutSession, ['cs_1'])
  assert.equal(calls.recordPaymentEvent.length, 1)
  assert.deepEqual(calls.fulfilPaidOrder, [])
})

test('processStripeWebhookEvent records unpaid checkout events without fulfilment', async () => {
  const { calls, processStripeWebhookEvent } = createTestProcessor()

  assert.deepEqual(
    await processStripeWebhookEvent(checkoutCompletedEvent({ paymentStatus: 'unpaid' })),
    {
      status: 'unpaid',
      orderId: 123
    }
  )
  assert.deepEqual(calls.recordPaymentEvent.map(call => call.orderId), [123])
  assert.deepEqual(calls.fulfilPaidOrder, [])
})

test('processStripeWebhookEvent fulfils paid checkout events and records payment event', async () => {
  const { calls, processStripeWebhookEvent } = createTestProcessor()

  assert.deepEqual(await processStripeWebhookEvent(checkoutCompletedEvent()), {
    status: 'fulfilled',
    orderId: 123
  })
  assert.deepEqual(calls.fulfilPaidOrder, [
    {
      checkoutSessionId: 'cs_1',
      paymentIntentId: 'pi_1'
    }
  ])
  assert.deepEqual(calls.recordPaymentEvent.map(call => call.orderId), [123])
})
