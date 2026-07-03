'use client'

import Link from 'next/link'
import { useState } from 'react'

const CONSENT_COOKIE = 'cmc_cookie_consent'
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180

const setClientConsentCookie = () => {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CONSENT_COOKIE}=necessary; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`
}

const recordServerConsent = () => {
  fetch('/api/cookie-consent', {
    method: 'POST',
    redirect: 'manual'
  }).catch(() => {})
}

const CookieConsentBannerContent = () => {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) {
    return null
  }

  return (
    <aside className='cmc-cookie-banner' aria-label='Cookie notice'>
      <div>
        <p className='cmc-cookie-banner__title'>Cookies on Classical Music Catalogue</p>
        <p>
          We currently use necessary cookies for sign-in, security, and payments.
          Optional analytics or marketing cookies are not enabled.
        </p>
      </div>
      <form
        action='/api/cookie-consent'
        className='cmc-cookie-banner__actions'
        method='post'
        onSubmit={event => {
          event.preventDefault()
          setClientConsentCookie()
          setIsDismissed(true)
          recordServerConsent()
        }}
      >
        <Link href='/cookies'>Cookie policy</Link>
        <button type='submit'>Accept necessary cookies</button>
      </form>
    </aside>
  )
}

export default CookieConsentBannerContent
