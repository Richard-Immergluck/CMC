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

const getLocalhostAliasOrigin = origin => {
  if (!origin) {
    return null
  }

  try {
    const url = new URL(origin)

    if (url.hostname === 'localhost') {
      url.hostname = '127.0.0.1'
      return url.origin
    }

    if (url.hostname === '127.0.0.1') {
      url.hostname = 'localhost'
      return url.origin
    }
  } catch {
    return null
  }

  return null
}

export const getRequestOriginPosture = ({
  requestUrl,
  originHeader,
  refererHeader,
  trustedOrigins = []
}) => {
  const requestOrigin = getUrlOrigin(requestUrl)
  const allowedOrigins = uniqueOrigins([
    requestOrigin,
    getLocalhostAliasOrigin(requestOrigin),
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
