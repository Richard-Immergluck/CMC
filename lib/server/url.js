const trimTrailingSlash = url => url.replace(/\/$/, '')

const getForwardedProtocol = req => {
  const forwardedProtocol = req.headers['x-forwarded-proto']

  if (Array.isArray(forwardedProtocol)) {
    return forwardedProtocol[0]
  }

  return forwardedProtocol || 'http'
}

const getRequestHost = req => {
  const forwardedHost = req.headers['x-forwarded-host']

  if (Array.isArray(forwardedHost)) {
    return forwardedHost[0]
  }

  return forwardedHost || req.headers.host
}

export const getRequestBaseUrl = req => {
  const host = getRequestHost(req)

  if (host) {
    return trimTrailingSlash(`${getForwardedProtocol(req)}://${host}`)
  }

  if (process.env.VERCEL_URL) {
    return trimTrailingSlash(`https://${process.env.VERCEL_URL}`)
  }

  if (process.env.NEXTAUTH_URL) {
    return trimTrailingSlash(process.env.NEXTAUTH_URL)
  }

  throw new Error('Unable to determine application URL')
}

export const getApplicationBaseUrl = req => {
  if (process.env.VERCEL_ENV === 'production' && process.env.NEXTAUTH_URL) {
    return trimTrailingSlash(process.env.NEXTAUTH_URL)
  }

  return getRequestBaseUrl(req)
}
