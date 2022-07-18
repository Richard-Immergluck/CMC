// Next-Auth Imports
import { SessionProvider } from 'next-auth/react'

// Style Imports
import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/globals.css'

// Cart Provider
import { CartProvider } from 'react-use-cart'

// Consistent ID generation between client and server
import { SSRProvider } from 'react-bootstrap'

// Component imports
import Navbar from '../components/Navbar'

import { useEffect } from 'react'

function MyApp({ session, Component, pageProps }) {
  // To allow Bootstrap to use javascript forcing next to render client side only
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap')
  }, [])

  return (
    <SSRProvider>
    <SessionProvider session={session}>
      <CartProvider>
        <Navbar />
        <Component {...pageProps} />
      </CartProvider>
    </SessionProvider>
    </SSRProvider>
  )
}

export default MyApp
