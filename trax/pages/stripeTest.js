// Code snippets taken from Stripe Checkout documentation
// https://stripe.com/docs/payments/checkout

import { useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Button, Container } from 'react-bootstrap'

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
loadStripe(process.env.STRIPE_PUBLISHABLE_KEY)

const TestPage = () => {
  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(window.location.search)
    if (query.get('success')) {
      console.log('Order placed! You will receive an email confirmation.')
    }

    if (query.get('canceled')) {
      console.log(
        'Order cancelled -- continue to shop around and checkout when you’re ready.'
      )
    }
  }, [])

  return (
    <form action='/api/stripe/checkout_sessions' method='POST'>
      <section>
        <br />
        <Container className='mt-5'>
        <Button type='submit' role='link' >
          Checkout Test
        </Button>
        </Container>
      </section>
    </form>
  )
}

export default TestPage