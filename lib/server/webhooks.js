import {
  findOrderByCheckoutSession,
  fulfilPaidOrder,
  hasProcessedPaymentEvent,
  recordPaymentEvent
} from './orders'
import { createStripeWebhookProcessor } from './webhooks-core.mjs'

export const processStripeWebhookEvent = createStripeWebhookProcessor({
  findOrderByCheckoutSession,
  fulfilPaidOrder,
  hasProcessedPaymentEvent,
  recordPaymentEvent
})
