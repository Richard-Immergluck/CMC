import { NextResponse } from 'next/server'

const CONSENT_COOKIE = 'cmc_cookie_consent'
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180

const getRedirectUrl = request => {
  const fallback = new URL('/', request.url)
  const referer = request.headers.get('referer')

  if (!referer) {
    return fallback
  }

  try {
    const redirectUrl = new URL(referer)

    if (redirectUrl.origin === fallback.origin) {
      return redirectUrl
    }
  } catch {
    return fallback
  }

  return fallback
}

export const POST = request => {
  const response = NextResponse.redirect(getRedirectUrl(request), 303)

  response.cookies.set({
    httpOnly: false,
    maxAge: CONSENT_MAX_AGE,
    name: CONSENT_COOKIE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    value: 'necessary'
  })

  return response
}
