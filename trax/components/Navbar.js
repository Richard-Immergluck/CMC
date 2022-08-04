import Link from 'next/link'
import { signIn, signOut, useSession } from 'next-auth/react'
import { Nav, Navbar, Container, NavDropdown } from 'react-bootstrap'

function MainNavbar() {
  const { data: session, status } = useSession()
  return (
    <>
      <Navbar className='shadow' bg='light' variant='light' expand='sm'>
        <Container>
          <Navbar.Brand href='/'>C.M.C (working title)</Navbar.Brand>
          <Navbar.Toggle aria-controls='navbarScroll' />
          <Navbar.Collapse id='navbarScroll'>
            <Nav
              className='ms-auto my-2 my-lg-0 gap-4'
              style={{ maxHeight: '100px' }}
              navbarScroll
            >
              {session && <Nav.Link href='/profile'>Profile</Nav.Link>}
              <Nav.Link href='/catalogue'>Catalogue</Nav.Link>
              {session && <Nav.Link href='/upload'>Upload</Nav.Link>}
              
              {status !== 'authenticated' && (
                <Nav.Link
                  href='/api/auth/signin'
                  onClick={e => {
                    e.preventDefault()
                    signIn()
                  }}
                >
                  Sign In
                </Nav.Link>
              )}
              {session && (
                <Nav.Link
                  href='/api/auth/signout'
                  onClick={e => {
                    e.preventDefault()
                    signOut({
                      callbackUrl: `/` // This will need to be changed when deploying
                    })
                  }}
                >
                  Sign Out
                </Nav.Link>
              )}

              {session && <Nav.Link href='/cart'>Cart</Nav.Link>}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  )
}

export default MainNavbar
