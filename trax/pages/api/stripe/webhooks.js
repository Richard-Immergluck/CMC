import Stripe from 'stripe'
import { buffer } from 'micro' // using micro to parse the body and check whether the request is coming directly from Stripe

// Tell Next.js to stop using the bodyParser
export const config = {
  api: {
    bodyParser: false
  }
}

export default async function webhookHandler(req, res) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  if (req.method === 'POST') {
    const buf = await buffer(req) // buffer the request body
    const sig = req.headers['stripe-signature'] // get the signature from the header
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event

    try {
      if (!sig || !webhookSecret) return
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
    } catch (err) {
      console.log(`Webhook Error: ${err.message}`)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }
    console.log('event', event)

    res.status(200).send()
  }
}
