import Link from 'next/link'
import { signIn, signOut, useSession } from 'next-auth/react'


function Navbar() {
  const { data: session, status } = useSession()
  return (
    <nav className='header'>
      <h1 className='logo'>
        <a>CMC (working title)</a>
      </h1>
      <ul
        className={`main-nav ${
          !session && status === 'loading' ? 'loading' : 'loaded'
        }`}
      >
        <li>
          <Link href='/'>
            <a>Home</a>
          </Link>
        </li>
        <li>
          <Link href='/catalogue'>
            <a>Catalogue</a>
          </Link>
        </li>
        {session && (
          <li>
            <Link href='/profile'>
              <a>Profile</a>
            </Link>
          </li>
        )}
         {session && (
        <li>
          <Link href='/uploadInterface'>
            <a>Upload</a>
          </Link>
        </li>
        )}
        {status !== 'authenticated' && (
          <li>
            <Link href='/api/auth/signin'>
              <a
                onClick={e => {
                  e.preventDefault()
                  signIn()
                }}
              >
                Sign In
              </a>
            </Link>
          </li>
        )}
        {session && (
          <li>
            <Link href='/api/auth/signout'>
              <a
                onClick={e => {
                  e.preventDefault()
                  signOut({
                    callbackUrl: `/` // This will need to be changed when deploying
                  })
                }}
              >
                Sign Out
              </a>
            </Link>
          </li>
        )}
        <li>
          <Link href='/cart'>
            <a>Cart</a>
          </Link>
        </li>
      </ul>
    </nav>
  )
}

export default Navbar
