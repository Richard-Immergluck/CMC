// Style Imports
import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/globals.css'

// Component imports
import Header from '../components/Header'
import AppProviders from '../components/providers/AppProviders'

function MyApp({ Component, pageProps }) {
  const { session, ...componentProps } = pageProps

  return (
    <AppProviders session={session}>
      <Header />
      <Component {...componentProps} />
    </AppProviders>
  )
}

export default MyApp
