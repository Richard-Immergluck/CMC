import React from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Nav, Navbar, Container } from 'react-bootstrap'
import { useCart } from 'react-use-cart'
import { BrandMark } from './brand'
import { canAccessSupportSurface, canUploadTracks } from '../lib/access-control.mjs'

function MainNavbar() {
  // instantiate cart
  const { emptyCart, items } = useCart()
  const cartItems = items.length

  // Get the session state
  const { data: session, status } = useSession()
  const user = session?.user
  const isAuthenticated = status === 'authenticated'

  return (
    <>
      <Navbar className='shadow' bg='light' variant='light' expand='sm'>
        <Container>
          <Navbar.Brand className='cmc-navbar-brand' href={isAuthenticated ? '/catalogue' : '/'}>
            <BrandMark compact />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls='navbarScroll' />
          <Navbar.Collapse id='navbarScroll'>
            <Nav
              className='ms-auto my-2 my-lg-0 gap-4'
              style={{ maxHeight: '100px' }}
              navbarScroll
            >
              {isAuthenticated && <Nav.Link href='/profile'>Profile</Nav.Link>}
              <Nav.Link href='/catalogue'>Catalogue</Nav.Link>
              {canUploadTracks(user) && <Nav.Link href='/upload'>Upload</Nav.Link>}
              {canAccessSupportSurface(user) && <Nav.Link href='/admin'>Admin</Nav.Link>}
              
              {status === 'unauthenticated' && (
                <Nav.Link
                  href='/auth/signin?callbackUrl=/catalogue'
                >
                  Sign In / Register
                </Nav.Link>
              )}
              {isAuthenticated && (
                <Nav.Link
                  href='/api/auth/signout'
                  onClick={e => {
                    e.preventDefault()
                    signOut({
                      callbackUrl: `/` // This will need to be changed when deploying
                    })
                    emptyCart()
                  }}
                >
                  Sign Out
                </Nav.Link>
              )}

              {isAuthenticated && <Nav.Link href='/cart'>Cart ({cartItems})</Nav.Link>}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  )
}

export default MainNavbar
