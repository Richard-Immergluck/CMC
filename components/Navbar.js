import React from 'react'
import { usePathname } from 'next/navigation'
import { Nav, Navbar, Container } from 'react-bootstrap'
import { BrandMark } from './brand'

function MainNavbar() {
  const pathname = usePathname()

  const navLinkClass = href => (
    pathname === href || pathname?.startsWith(`${href}/`) ? 'cmc-navbar-link--active' : ''
  )

  return (
    <>
      <Navbar className='cmc-navbar' expand='sm'>
        <Container>
          <Navbar.Brand className='cmc-navbar-brand' href='/catalogue'>
            <BrandMark compact wordmark='navFull' />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls='navbarScroll' />
          <Navbar.Collapse id='navbarScroll'>
            <Nav
              className='cmc-navbar-nav ms-auto my-2 my-lg-0'
              navbarScroll
            >
              <Nav.Link className={navLinkClass('/catalogue')} href='/catalogue'>Catalogue</Nav.Link>
              <Nav.Link
                className={navLinkClass('/auth/signin')}
                href='/auth/signin?callbackUrl=/catalogue'
              >
                Login / Sign up
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  )
}

export default MainNavbar
