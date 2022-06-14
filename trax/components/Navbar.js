import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

function Navbar() {
  const { data: session, status } = useSession();
  return (
    <nav className="header">
      <h1 className="logo">
        <a href="#">CMC (working title)</a>
      </h1>
      <ul className={`main-nav ${!session && status === 'loading' ? 'loading': 'loaded'}`}>
        <li>
          <Link href="/">
            <a>Home</a>
          </Link>
        </li>
        <li>
          <Link href="/catalogue">
            <a>Catalogue</a>
          </Link>
        </li>
        {session && (
          <li>
            <Link href="/dashboard">
              <a>Profile</a>
            </Link>
          </li>
        )}
        <li>
          <Link href="/blog">
            <a>Forum</a>
          </Link>
        </li>
        <li>
          <Link href="/testUploadInterface">
            <a>Upload</a>
          </Link>
        </li>
        {status !== "authenticated" && (
          <li>
            <Link href="/api/auth/signin">
              <a
                onClick={(e) => {
                  e.preventDefault();
                  signIn();
                }}
              >
                Sign In
              </a>
            </Link>
          </li>
        )}
        {session && (
          <li>
            <Link href="/api/auth/signout">
              <a
                onClick={(e) => {
                  e.preventDefault();
                  signOut();
                }}
              >
                Sign Out
              </a>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
