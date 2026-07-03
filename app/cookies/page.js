export const metadata = {
  title: 'Cookie Policy | Classical Music Catalogue',
  description: 'How Classical Music Catalogue uses cookies for sign-in, security, and payments.'
}

const CookiePolicyPage = () => (
  <main className='cmc-legal-page'>
    <div className='container-xl'>
      <div className='cmc-legal-page__header'>
        <p className='cmc-kicker'>Cookie policy</p>
        <h1>Cookies on Classical Music Catalogue.</h1>
        <p>
          This placeholder policy describes the cookies the platform currently uses
          and the consent approach we will extend if optional analytics or marketing
          tools are added later.
        </p>
      </div>

      <section className='cmc-legal-section'>
        <h2>Current position</h2>
        <p>
          CMC currently appears to use necessary first-party cookies for authentication,
          session security, and account access. These are required for the site to work
          and cannot be switched off through the platform.
        </p>
      </section>

      <section className='cmc-legal-section'>
        <h2>Necessary cookies</h2>
        <ul>
          <li>NextAuth session cookies keep signed-in users authenticated.</li>
          <li>Security and CSRF cookies help protect sign-in and account actions.</li>
          <li>A CMC cookie-consent cookie stores that the cookie notice has been acknowledged.</li>
        </ul>
      </section>

      <section className='cmc-legal-section'>
        <h2>Payment and third-party cookies</h2>
        <p>
          Stripe may use cookies or similar technologies during checkout for payment
          processing, fraud prevention, and transaction security. Google may also use
          cookies during Google sign-in. These providers control their own cookies.
        </p>
      </section>

      <section className='cmc-legal-section'>
        <h2>Analytics and marketing</h2>
        <p>
          Optional analytics, advertising, or marketing cookies are not currently
          enabled in the app. If they are introduced later, CMC should request consent
          before loading those tools and should provide a way to change that choice.
        </p>
      </section>

      <section className='cmc-legal-section'>
        <h2>Managing cookies</h2>
        <p>
          You can remove or block cookies through your browser settings. Blocking
          necessary cookies may prevent sign-in, purchasing, uploads, profile access,
          and other account features from working correctly.
        </p>
      </section>
    </div>
  </main>
)

export default CookiePolicyPage
