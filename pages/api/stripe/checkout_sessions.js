import {
  handleApiError,
  requireCurrentUser,
  requireMethod,
  sendJson
} from '../../../lib/server/api'
import {
  createPendingOrder,
  markOrderCheckoutSession
} from '../../../lib/server/orders'
import { getStripe } from '../../../lib/server/stripe'
import { getApplicationBaseUrl } from '../../../lib/server/url'
import {
  checkoutSessionBodySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

export default async function handler(req, res) {
  try {
    requireMethod(req, res, ['POST'])

    const user = await requireCurrentUser(req)
    const { trackIds } = validateInput(
      checkoutSessionBodySchema,
      req.body,
      'Invalid checkout request'
    )

    const order = await createPendingOrder({
      user,
      trackIds
    })

    const stripe = getStripe()
    const applicationUrl = getApplicationBaseUrl(req)

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

    return sendJson(res, 200, { url: checkoutSession.url })
  } catch (error) {
    return handleApiError(res, error)
  }
}
