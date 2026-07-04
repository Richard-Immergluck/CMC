import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/globals.css'
import { getServerSession } from 'next-auth'
import CookieConsentBanner from '../components/CookieConsentBanner'
import AppProviders from '../components/providers/AppProviders'
import { authOptions } from '../lib/server/auth'

export const metadata = {
  title: 'Classical Music Catalogue',
  description: 'Classical Music Backing-Track Catalogue',
  other: {
    'Classical Music Backing-Track Catalogue': 'Classical Music Backing-Track Catalogue'
  }
}

const RootLayout = async ({ children }) => {
  const session = await getServerSession(authOptions)

  return (
    <html lang='en'>
      <body>
        <AppProviders session={session}>{children}</AppProviders>
        <CookieConsentBanner />
      </body>
    </html>
  )
}

export default RootLayout
