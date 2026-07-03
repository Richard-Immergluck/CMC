import { cookies } from 'next/headers'
import CookieConsentBannerContent from './CookieConsentBannerContent'

const CONSENT_COOKIE = 'cmc_cookie_consent'

const CookieConsentBanner = async () => {
  const cookieStore = await cookies()
  const hasAccepted = cookieStore.get(CONSENT_COOKIE)?.value === 'necessary'

  if (hasAccepted) {
    return null
  }

  return <CookieConsentBannerContent />
}

export default CookieConsentBanner
