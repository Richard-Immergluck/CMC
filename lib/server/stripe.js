import Stripe from 'stripe'

const localE2EStripeEnabled = () => {
  return process.env.CMC_ENABLE_E2E_STRIPE === 'true' &&
    process.env.VERCEL_ENV !== 'production'
}

const createLocalE2EStripe = () => {
  return {
    checkout: {
      sessions: {
        create: async checkoutOptions => {
          const orderId = checkoutOptions.metadata?.orderId || 'unknown'
          const id = `cs_e2e_${orderId}`

          return {
            id,
            url: checkoutOptions.success_url.replace('{CHECKOUT_SESSION_ID}', id)
          }
        },
        retrieve: async sessionId => ({
          id: sessionId,
          payment_status: 'paid',
          payment_intent: `pi_${sessionId}`
        })
      }
    }
  }
}

export const getStripe = () => {
  if (localE2EStripeEnabled()) {
    return createLocalE2EStripe()
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY)
}
