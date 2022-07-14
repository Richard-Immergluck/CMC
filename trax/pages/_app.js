// Next-Auth Imports
import { SessionProvider } from 'next-auth/react'

// Style Imports
import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/globals.css'
import '../components/Navbar.css'
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css'

// Cart Provider
import { CartProvider } from 'react-use-cart'

// Component imports
import Navbar from '../components/Navbar'

import { useEffect } from 'react'


function MyApp({ session, Component, pageProps }) {
  
  // To allow Bootstrap to use javascript forcing next to render client side only
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap')
  }, [])

  return (
    <>
      <CartProvider>
        <SessionProvider session={session}>
          <Navbar />
          <Component {...pageProps} />
        </SessionProvider>
      </CartProvider>
    </>
  )
}

export default MyApp
