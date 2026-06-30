'use client'

import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { Alert, Button, Col, Container, Form, Row } from 'react-bootstrap'

const errorMessages = {
  OAuthSignin: 'The sign-in provider could not be reached. Please try again.',
  OAuthCallback: 'The sign-in provider returned an unexpected response.',
  OAuthAccountNotLinked: 'That email is already connected to a different sign-in method.',
  EmailSignin: 'The magic-link email could not be sent. Please check the address and try again.',
  Configuration: 'Sign-in is not fully configured for this environment.',
  AccessDenied: 'Access was denied for this account.',
  Verification: 'That sign-in link has expired or has already been used.'
}

const SignInPageContent = ({ callbackUrl, error, providers }) => {
  const [email, setEmail] = useState('')
  const [emailSubmitting, setEmailSubmitting] = useState(false)
  const providerList = Object.values(providers).filter(provider => provider.id !== 'email')
  const emailProvider = providers.email
  const message = error ? errorMessages[error] || 'Sign-in could not be completed. Please try again.' : ''

  const submitEmail = async event => {
    event.preventDefault()
    setEmailSubmitting(true)
    await signIn('email', {
      callbackUrl,
      email
    })
    setEmailSubmitting(false)
  }

  return (
    <main className='cmc-auth-page'>
      <Container fluid='xl'>
        <Row className='align-items-center g-5'>
          <Col lg={7}>
            <p className='cmc-kicker'>Member access</p>
            <h1>Sign in to your catalogue workspace.</h1>
            <p className='cmc-auth-copy'>
              Continue to purchased tracks, comments, uploads, requests, and the
              marketplace catalogue with the same calm working surface as the rest of
              Classical Music Catalogue.
            </p>
          </Col>
          <Col lg={5}>
            <section className='cmc-auth-panel' aria-label='Sign in options'>
              <div>
                <span>Classical Music Catalogue account</span>
                <h2>Sign in or register</h2>
                <p>New users can create an account using an available sign-in method.</p>
              </div>

              {message && (
                <Alert variant='danger' className='cmc-auth-alert'>
                  {message}
                </Alert>
              )}

              <div className='cmc-auth-provider-list'>
                {providerList.map(provider => (
                  <Button
                    className='cmc-auth-provider-button'
                    key={provider.id}
                    type='button'
                    onClick={() => signIn(provider.id, { callbackUrl })}
                  >
                    Continue with {provider.name}
                  </Button>
                ))}
              </div>

              {emailProvider && (
                <Form className='cmc-auth-email-form' onSubmit={submitEmail}>
                  <Form.Group controlId='signin-email'>
                    <Form.Label>Email address</Form.Label>
                    <Form.Control
                      autoComplete='email'
                      inputMode='email'
                      onChange={event => setEmail(event.target.value)}
                      placeholder='you@example.com'
                      required
                      type='email'
                      value={email}
                    />
                  </Form.Group>
                  <Button
                    className='cmc-auth-provider-button'
                    disabled={emailSubmitting}
                    type='submit'
                  >
                    {emailSubmitting ? 'Sending link...' : 'Send magic link'}
                  </Button>
                </Form>
              )}

              {providerList.length === 0 && !emailProvider && (
                <Alert variant='warning' className='cmc-auth-alert'>
                  Sign-in providers are not configured for this environment.
                </Alert>
              )}

              <Link href='/' className='cmc-auth-home-link'>
                Return to homepage
              </Link>
            </section>
          </Col>
        </Row>
      </Container>
    </main>
  )
}

export default SignInPageContent
