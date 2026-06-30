export const parseEmailRecipients = value => {
  if (!value) {
    return []
  }

  return Array.from(
    new Set(
      String(value)
        .split(',')
        .map(recipient => recipient.trim())
        .filter(Boolean)
    )
  )
}

export const getRequestedAccessChanges = request => {
  const changes = []

  if (request.requestedRole) {
    changes.push(`role -> ${request.requestedRole}`)
  }

  if (request.requestedAccountStatus) {
    changes.push(`account status -> ${request.requestedAccountStatus}`)
  }

  if (request.requestedUploaderStatus) {
    changes.push(`uploader status -> ${request.requestedUploaderStatus}`)
  }

  return changes
}

export const buildAdminAccessReviewUrl = ({ baseUrl, requestId }) => {
  if (!baseUrl || !requestId) {
    return null
  }

  try {
    return new URL('/admin?tab=operations', baseUrl).toString()
  } catch {
    return null
  }
}

export const buildUserAccessChangeRequestEmail = ({
  appUrl,
  request
}) => {
  const changes = getRequestedAccessChanges(request)
  const requestedBy = request.requestedBy?.email || request.requestedBy?.id || 'Unknown requester'
  const targetUser = request.targetUser?.email || request.targetUser?.id || 'Unknown target user'
  const reviewUrl = buildAdminAccessReviewUrl({
    baseUrl: appUrl,
    requestId: request.id
  })

  return {
    subject: `CMC access change review required (#${request.id})`,
    text: [
      'A privileged CMC user access change requires second review.',
      '',
      `Request ID: ${request.id}`,
      `Requested by: ${requestedBy}`,
      `Target user: ${targetUser}`,
      `Requested changes: ${changes.length > 0 ? changes.join(', ') : 'No access fields supplied'}`,
      `Created at: ${request.createdAt ? new Date(request.createdAt).toISOString() : 'Unknown'}`,
      '',
      reviewUrl ? `Review in admin operations: ${reviewUrl}` : 'Review in the admin operations console.',
      '',
      'The requester-provided reason is intentionally not included in this email. Review it in the admin console if needed.'
    ].join('\n')
  }
}
