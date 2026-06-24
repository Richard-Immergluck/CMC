import assert from 'node:assert/strict'
import test from 'node:test'
import {
  describeStripeWebhookEvent,
  getCheckoutSessionId,
  getPaymentIntentId,
  isPaidCheckoutSession,
  isSupportedStripeWebhookEvent
} from '../lib/server/webhooks-core.mjs'

const completedEvent = {
  id: 'evt_1',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_1',
      payment_status: 'paid',
      payment_intent: 'pi_1'
    }
  }
}

test('checkout.session.completed is the supported fulfilment event', () => {
  assert.equal(isSupportedStripeWebhookEvent(completedEvent), true)
  assert.equal(isSupportedStripeWebhookEvent({ ...completedEvent, type: 'payment_intent.succeeded' }), false)
})

test('getCheckoutSessionId only returns checkout session ids for supported session events', () => {
  assert.equal(getCheckoutSessionId(completedEvent), 'cs_1')
  assert.equal(getCheckoutSessionId({ ...completedEvent, type: 'payment_intent.succeeded' }), null)
})

test('checkout payment helpers normalize paid status and payment intent shape', () => {
  assert.equal(isPaidCheckoutSession(completedEvent.data.object), true)
  assert.equal(isPaidCheckoutSession({ payment_status: 'unpaid' }), false)
  assert.equal(getPaymentIntentId(completedEvent.data.object), 'pi_1')
  assert.equal(getPaymentIntentId({ payment_intent: { id: 'pi_object' } }), 'pi_object')
  assert.equal(getPaymentIntentId({}), undefined)
})

test('describeStripeWebhookEvent summarizes support-relevant metadata', () => {
  assert.deepEqual(describeStripeWebhookEvent(completedEvent), {
    id: 'evt_1',
    type: 'checkout.session.completed',
    supported: true,
    checkoutSessionId: 'cs_1'
  })
})

