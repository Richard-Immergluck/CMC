import nodemailer from 'nodemailer'
import {
  buildUserAccessChangeRequestEmail,
  parseEmailRecipients
} from './admin-access-notifications-core.mjs'

export const getUserAccessReviewNotificationConfig = () => {
  const recipients = parseEmailRecipients(process.env.ADMIN_ACCESS_REVIEW_EMAIL_RECIPIENTS)

  return {
    enabled: Boolean(process.env.EMAIL_SERVER && process.env.EMAIL_FROM && recipients.length > 0),
    server: process.env.EMAIL_SERVER,
    from: process.env.EMAIL_FROM,
    recipients,
    appUrl: process.env.NEXTAUTH_URL
  }
}

export const sendUserAccessChangeRequestNotification = async ({
  request,
  logger = console,
  transportFactory = nodemailer.createTransport
}) => {
  const config = getUserAccessReviewNotificationConfig()

  if (!config.enabled) {
    return {
      sent: false,
      reason: 'not_configured'
    }
  }

  const message = buildUserAccessChangeRequestEmail({
    appUrl: config.appUrl,
    request
  })

  try {
    const transport = transportFactory(config.server)

    await transport.sendMail({
      from: config.from,
      to: config.recipients,
      subject: message.subject,
      text: message.text
    })

    return {
      sent: true,
      recipients: config.recipients.length
    }
  } catch (error) {
    logger.warn?.('Failed to send user access change review notification', {
      requestId: request?.id,
      error: error?.message
    })

    return {
      sent: false,
      reason: 'send_failed'
    }
  }
}
