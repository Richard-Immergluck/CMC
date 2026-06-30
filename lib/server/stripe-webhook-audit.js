import {
  auditActions,
  buildAuditEventData,
  buildStripeWebhookSignatureFailedMetadata
} from './audit-core.mjs'
import { logServerEvent } from './logging'
import prisma from './prisma'

export const recordStripeWebhookSignatureFailure = async ({
  error,
  hasSignatureHeader,
  requestId,
  route = '/api/stripe/webhook'
}) => {
  try {
    await prisma.auditEvent.create({
      data: buildAuditEventData({
        action: auditActions.stripeWebhookSignatureFailed,
        entityType: 'StripeWebhook',
        entityId: requestId || 'unknown',
        metadata: buildStripeWebhookSignatureFailedMetadata({
          error,
          hasSignatureHeader,
          requestId,
          route
        })
      })
    })
  } catch (auditError) {
    logServerEvent({
      level: 'warn',
      event: 'stripe.webhook_signature_audit_failed',
      message: 'Failed to persist Stripe webhook signature failure audit event',
      requestId,
      metadata: {
        error: auditError.message
      }
    })
  }
}
