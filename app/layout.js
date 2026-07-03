import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/globals.css'
import CookieConsentBanner from '../components/CookieConsentBanner'
import AppProviders from '../components/providers/AppProviders'

export const metadata = {
  title: 'Classical Music Catalogue',
  description: 'Classical Music Backing-Track Catalogue',
  other: {
    'Classical Music Backing-Track Catalogue': 'Classical Music Backing-Track Catalogue'
  }
}

const RootLayout = ({ children }) => (
  <html lang='en'>
    <body>
      <AppProviders>{children}</AppProviders>
      <CookieConsentBanner />
    </body>
  </html>
)

export default RootLayout
