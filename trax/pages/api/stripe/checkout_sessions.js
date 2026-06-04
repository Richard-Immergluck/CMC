import { getSession } from 'next-auth/react'
import { getCurrentUser } from '../../../lib/server/ownership'
import {
  createPendingOrder,
  markOrderCheckoutSession
} from '../../../lib/server/orders'
import { getStripe } from '../../../lib/server/stripe'

const getApplicationUrl = req => {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }

  const protocol = req.headers['x-forwarded-proto'] || 'http'
  return `${protocol}://${req.headers.host}`
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const authSession = await getSession({ req })
      const user = await getCurrentUser(authSession)

      if (!user) {
        return res.status(401).json({ message: 'Authentication required' })
      }

      const { trackIds } = req.body

      if (!Array.isArray(trackIds)) {
        return res.status(400).json({ message: 'trackIds must be an array' })
      }

      const order = await createPendingOrder({
        user,
        trackIds
      })

      const stripe = getStripe()
      const applicationUrl = getApplicationUrl(req)

      const checkoutSession = await stripe.checkout.sessions.create({
        line_items: order.items.map(item => ({
          price_data: {
            currency: item.currency,
            product_data: {
              name: `${item.title} - ${item.composer}`
            },
            unit_amount: item.unitAmount
          },
          quantity: 1
        })),
        mode: 'payment',
        success_url: `${applicationUrl}/profile?checkout=success`,
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

      return res.status(200).json({ url: checkoutSession.url })
    } catch (err) {
      return res.status(err.statusCode || 500).json({ message: err.message })
    }
  } else {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }
}
