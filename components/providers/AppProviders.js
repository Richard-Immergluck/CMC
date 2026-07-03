'use client'

import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'
import { SSRProvider } from 'react-bootstrap'
import { CartProvider } from 'react-use-cart'
import Footer from '../Footer'
import Navbar from '../Navbar'

const AppProviders = ({ children, session }) => {
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap')
  }, [])

  return (
    <SSRProvider>
      <SessionProvider session={session}>
        <CartProvider>
          <Navbar />
          {children}
          <Footer />
        </CartProvider>
      </SessionProvider>
    </SSRProvider>
  )
}

export default AppProviders
