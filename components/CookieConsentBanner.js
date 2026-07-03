import { cookies } from 'next/headers'
import Link from 'next/link'

const CONSENT_COOKIE = 'cmc_cookie_consent'
const dismissScript = `
  document.getElementById('cmc-cookie-consent-form')?.addEventListener('submit', function () {
    document.querySelector('.cmc-cookie-banner')?.setAttribute('hidden', '');
  });
`

const CookieConsentBanner = async () => {
  const cookieStore = await cookies()
  const hasAccepted = cookieStore.get(CONSENT_COOKIE)?.value === 'necessary'

  if (hasAccepted) {
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
        id='cmc-cookie-consent-form'
        method='post'
      >
        <Link href='/cookies'>Cookie policy</Link>
        <button type='submit'>Accept necessary cookies</button>
      </form>
      <script dangerouslySetInnerHTML={{ __html: dismissScript }} />
    </aside>
  )
}

export default CookieConsentBanner
