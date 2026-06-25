import assert from 'node:assert/strict'
import test from 'node:test'
import { createCheckoutSessionReconciler } from '../lib/server/purchases-core.mjs'

const createHarness = ({
  orderBySession = null,
  checkoutSession = {
    id: 'cs_test_1',
    payment_status: 'paid',
    payment_intent: 'pi_test_1'
  }
} = {}) => {
  const calls = {
    findOrderByCheckoutSession: [],
    fulfilPaidOrder: [],
    recordPaymentEvent: [],
    retrieveCheckoutSession: []
  }

  const reconcile = createCheckoutSessionReconciler({
    findOrderByCheckoutSession: async checkoutSessionId => {
      calls.findOrderByCheckoutSession.push(checkoutSessionId)
      return orderBySession
    },
    fulfilPaidOrder: async input => {
      calls.fulfilPaidOrder.push(input)
      return { id: 10 }
    },
    recordPaymentEvent: async input => {
      calls.recordPaymentEvent.push(input)
    },
    retrieveCheckoutSession: async checkoutSessionId => {
      calls.retrieveCheckoutSession.push(checkoutSessionId)
      return checkoutSession
    }
  })

  return {
    calls,
    reconcile
  }
}

const activeUser = {
  id: 'user_1'
}

test('checkout reconciliation fulfils a paid checkout session for the signed-in user', async () => {
  const { calls, reconcile } = createHarness({
    orderBySession: {
      id: 10,
      userId: activeUser.id,
      status: 'PENDING',
      stripeCheckoutSession: 'cs_test_1'
    }
  })

  assert.deepEqual(await reconcile({
    checkoutSessionId: 'cs_test_1',
    user: activeUser
  }), {
    status: 'fulfilled',
    orderId: 10
  })
  assert.deepEqual(calls.findOrderByCheckoutSession, ['cs_test_1'])
  assert.deepEqual(calls.retrieveCheckoutSession, ['cs_test_1'])
  assert.deepEqual(calls.fulfilPaidOrder, [{
    checkoutSessionId: 'cs_test_1',
    paymentIntentId: 'pi_test_1'
  }])
  assert.equal(calls.recordPaymentEvent[0].stripeEvent.id, 'checkout_session_reconciled:cs_test_1')
  assert.equal(calls.recordPaymentEvent[0].orderId, 10)
})

test('checkout reconciliation refuses sessions that belong to another user', async () => {
  const { calls, reconcile } = createHarness({
    orderBySession: {
      id: 10,
      userId: 'user_2',
      status: 'PENDING',
      stripeCheckoutSession: 'cs_test_1'
    }
  })

  assert.deepEqual(await reconcile({
    checkoutSessionId: 'cs_test_1',
    user: activeUser
  }), {
    status: 'not_found',
    orderId: null
  })
  assert.deepEqual(calls.retrieveCheckoutSession, [])
  assert.deepEqual(calls.fulfilPaidOrder, [])
})

test('checkout reconciliation refuses unpaid checkout sessions', async () => {
  const { calls, reconcile } = createHarness({
    orderBySession: {
      id: 10,
      userId: activeUser.id,
      status: 'PENDING',
      stripeCheckoutSession: 'cs_test_1'
    },
    checkoutSession: {
      id: 'cs_test_1',
      payment_status: 'unpaid',
      payment_intent: 'pi_test_1'
    }
  })

  assert.deepEqual(await reconcile({
    checkoutSessionId: 'cs_test_1',
    user: activeUser
  }), {
    status: 'unpaid',
    orderId: 10
  })
  assert.deepEqual(calls.fulfilPaidOrder, [])
  assert.deepEqual(calls.recordPaymentEvent, [])
})

test('checkout reconciliation is idempotent for already paid orders', async () => {
  const { calls, reconcile } = createHarness({
    orderBySession: {
      id: 10,
      userId: activeUser.id,
      status: 'PAID',
      stripeCheckoutSession: 'cs_test_1'
    }
  })

  assert.deepEqual(await reconcile({
    checkoutSessionId: 'cs_test_1',
    user: activeUser
  }), {
    status: 'already_fulfilled',
    orderId: 10
  })
  assert.deepEqual(calls.retrieveCheckoutSession, [])
  assert.deepEqual(calls.fulfilPaidOrder, [])
})
