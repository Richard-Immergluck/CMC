// Session Provider
import { SessionProvider } from 'next-auth/react' 

// Style Imports
import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/globals.css'

// Cart Provider
import { CartProvider } from 'react-use-cart'

// Consistent ID generation between client and server for Bootstrap
import { SSRProvider } from 'react-bootstrap'

// Component imports
import Navbar from '../components/Navbar'
import Header from '../components/Header'

import { useEffect } from 'react'

function MyApp({ session, Component, pageProps }) {
  
  // Function to stop Bootstrap from throwing client/server mismatch errors
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap')
  }, [])

  return (
    <SSRProvider>
    <SessionProvider session={session}>
      <CartProvider>
        <Navbar />
        <Header />
        <Component {...pageProps} />
      </CartProvider>
    </SessionProvider>
    </SSRProvider>
  )
}

export default MyApp
