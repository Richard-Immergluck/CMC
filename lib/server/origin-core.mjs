export const getUrlOrigin = value => {
  if (!value) {
    return null
  }

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

const uniqueOrigins = origins => [...new Set(origins.filter(Boolean))]

export const getRequestOriginPosture = ({
  requestUrl,
  originHeader,
  refererHeader,
  trustedOrigins = []
}) => {
  const requestOrigin = getUrlOrigin(requestUrl)
  const allowedOrigins = uniqueOrigins([
    requestOrigin,
    ...trustedOrigins.map(getUrlOrigin)
  ])
  const suppliedOrigin = getUrlOrigin(originHeader) || getUrlOrigin(refererHeader)

  if (!suppliedOrigin) {
    return {
      trusted: true,
      reason: 'missing_origin_headers'
    }
  }

  if (allowedOrigins.length === 0) {
    return {
      trusted: false,
      reason: 'invalid_request_url'
    }
  }

  if (!allowedOrigins.includes(suppliedOrigin)) {
    return {
      trusted: false,
      reason: 'origin_mismatch',
      requestOrigin,
      allowedOrigins,
      suppliedOrigin
    }
  }

  return {
    trusted: true,
    reason: 'same_origin',
    requestOrigin,
    allowedOrigins,
    suppliedOrigin
  }
}
