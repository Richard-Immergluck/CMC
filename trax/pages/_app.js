// Next-Auth Imports
import { SessionProvider } from "next-auth/react"

// Style Imports
import 'bootstrap/dist/css/bootstrap.css'
import "../styles/globals.css";
import "../components/Navbar.css";

// Component imports
import Navbar from "../components/Navbar";

import { useEffect } from "react"

function MyApp({ session, Component, pageProps }) {
  
  // To allow Bootstrap to use javascript forcing next to render client side only
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap");
  }, []);
  
  return (
    <>
      <SessionProvider session={session}>
      <Navbar />
      <Component {...pageProps} />
      </SessionProvider>
    </>
  );
}

export default MyApp;
