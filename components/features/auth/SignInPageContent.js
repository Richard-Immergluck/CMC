'use client'

import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { Alert, Col, Container, Form, Row } from 'react-bootstrap'
import BrandDisplayText from '../../brand/BrandDisplayText'
import { Button, Panel } from '../../ui/primitives'

const devLoginUsers = [
  {
    email: 'e2e-customer@example.com',
    label: 'Customer'
  },
  {
    email: 'e2e-uploader@example.com',
    label: 'Uploader'
  },
  {
    email: 'e2e-admin@example.com',
    label: 'Admin'
  },
  {
    email: 'e2e-support@example.com',
    label: 'Support'
  }
]

const errorMessages = {
  OAuthSignin: 'The sign-in provider could not be reached. Please try again.',
  OAuthCallback: 'The sign-in provider returned an unexpected response.',
  OAuthAccountNotLinked: 'That email is already connected to a different sign-in method.',
  EmailSignin: 'The magic-link email could not be sent. Please check the address and try again.',
  Configuration: 'Sign-in is not fully configured for this environment.',
  AccessDenied: 'Access was denied for this account.',
  Verification: 'That sign-in link has expired or has already been used.'
}

const SignInPageContent = ({ callbackUrl, devLoginEnabled = false, error, providers }) => {
  const [email, setEmail] = useState('')
  const [emailSubmitting, setEmailSubmitting] = useState(false)
  const [devLoginSubmitting, setDevLoginSubmitting] = useState('')
  const [devLoginError, setDevLoginError] = useState('')
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

  const submitDevLogin = async user => {
    setDevLoginSubmitting(user.email)
    setDevLoginError('')

    try {
      const response = await fetch('/api/e2e/session', {
        body: JSON.stringify({ email: user.email }),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || body.message || 'Dev login could not be completed.')
      }

      window.location.assign(callbackUrl)
    } catch (loginError) {
      setDevLoginError(loginError.message)
    } finally {
      setDevLoginSubmitting('')
    }
  }

  return (
    <main className='cmc-auth-page'>
      <Container fluid='xl'>
        <Row className='align-items-center g-5'>
          <Col lg={7}>
            <div className='cmc-home-section-heading cmc-auth-heading'>
              <div className='cmc-home-paper-indent' aria-hidden='true' />
              <div>
                <p className='cmc-kicker'>Member access</p>
                <h1>
                  <BrandDisplayText text='Sign in to your catalogue workspace.' />
                </h1>
                <p className='cmc-auth-copy'>
                  Continue to purchased tracks, comments, uploads, requests, and the
                  marketplace catalogue with the same calm working surface as the rest of
                  Classical Music Catalogue.
                </p>
              </div>
            </div>
          </Col>
          <Col lg={5}>
            <Panel as='section' className='cmc-auth-panel' tone='accent' aria-label='Sign in options'>
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

              {devLoginError && (
                <Alert variant='danger' className='cmc-auth-alert'>
                  {devLoginError}
                </Alert>
              )}

              <div className='cmc-auth-provider-list'>
                {providerList.map(provider => (
                  <Button
                    className='cmc-auth-provider-button'
                    key={provider.id}
                    type='button'
                    variant='secondary'
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
                    variant='secondary'
                  >
                    {emailSubmitting ? 'Sending link...' : 'Send magic link'}
                  </Button>
                </Form>
              )}

              {devLoginEnabled && (
                <div className='cmc-auth-dev-login' aria-label='Development sign in options'>
                  <span>Local development access</span>
                  <p>Use seeded test roles for local UI checks.</p>
                  <div className='cmc-auth-dev-login-grid'>
                    {devLoginUsers.map(user => (
                      <Button
                        className='cmc-auth-provider-button'
                        disabled={Boolean(devLoginSubmitting)}
                        key={user.email}
                        type='button'
                        variant='secondary'
                        onClick={() => submitDevLogin(user)}
                      >
                        {devLoginSubmitting === user.email ? 'Signing in...' : user.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {providerList.length === 0 && !emailProvider && (
                <Alert variant='warning' className='cmc-auth-alert'>
                  Sign-in providers are not configured for this environment.
                </Alert>
              )}

              <Link href='/' className='cmc-auth-home-link'>
                Return to homepage
              </Link>
            </Panel>
          </Col>
        </Row>
      </Container>
    </main>
  )
}

export default SignInPageContent
