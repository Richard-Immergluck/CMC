import React, { useEffect, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Nav, Navbar, Container } from 'react-bootstrap'
import { useCart } from 'react-use-cart'
import { BrandMark } from './brand'
import { canAccessSupportSurface, canStartTrackUpload } from '../lib/access-control.mjs'

function MainNavbar() {
  const pathname = usePathname()
  const { emptyCart, items } = useCart()
  const { data: session, status } = useSession()
  const [cartMounted, setCartMounted] = useState(false)
  const user = session?.user
  const cartItems = cartMounted ? items.length : 0
  const isAuthenticated = status === 'authenticated'

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setCartMounted(true)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [])

  const navLinkClass = (href, className = '') => [
    pathname === href || pathname?.startsWith(`${href}/`) ? 'cmc-navbar-link--active' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <>
      <Navbar aria-label='Primary navigation' className='cmc-navbar' expand='sm'>
        <Container>
          <Navbar.Brand className='cmc-navbar-brand' href={isAuthenticated ? '/catalogue' : '/'}>
            <BrandMark compact wordmark='navFull' />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls='navbarScroll' />
          <Navbar.Collapse id='navbarScroll'>
            <Nav
              className='cmc-navbar-nav ms-auto my-2 my-lg-0'
              navbarScroll
            >
              <Nav.Link className={navLinkClass('/catalogue')} href='/catalogue'>Catalogue</Nav.Link>
              <Nav.Link className={navLinkClass('/works-collections')} href='/works-collections'>Works</Nav.Link>
              {isAuthenticated && <Nav.Link className={navLinkClass('/profile')} href='/profile'>Profile</Nav.Link>}
              {canStartTrackUpload(user) && <Nav.Link className={navLinkClass('/upload')} href='/upload'>Upload</Nav.Link>}
              {canAccessSupportSurface(user) && <Nav.Link className={navLinkClass('/admin')} href='/admin'>Admin</Nav.Link>}
              {status === 'unauthenticated' && (
                <Nav.Link
                  className={navLinkClass('/auth/signin')}
                  href='/auth/signin?callbackUrl=/catalogue'
                >
                  Login / Sign up
                </Nav.Link>
              )}
              {isAuthenticated && <Nav.Link className={navLinkClass('/cart')} href='/cart'>Cart ({cartItems})</Nav.Link>}
              {isAuthenticated && (
                <Nav.Link
                  href='/api/auth/signout'
                  onClick={e => {
                    e.preventDefault()
                    signOut({
                      callbackUrl: '/'
                    })
                    emptyCart()
                  }}
                >
                  Sign Out
                </Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  )
}

export default MainNavbar
