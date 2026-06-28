'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useCart } from 'react-use-cart'
import Link from 'next/link'
import {
  Button,
  Card,
  CloseButton,
  Col,
  Container,
  ListGroup,
  Row
} from 'react-bootstrap'

const checkoutCanceledMessage = 'Checkout was cancelled. Your cart has been kept so you can review it or try again when you are ready.'

const formatter = new Intl.NumberFormat('en-UK', {
  style: 'currency',
  currency: 'GBP'
})

const CartPageContent = () => {
  const [checkoutError, setCheckoutError] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const searchParams = useSearchParams()
  const checkoutCanceled = searchParams.get('checkout') === 'canceled'
  const { data: session } = useSession()
  const { removeItem, cartTotal, items } = useCart()
  const total = formatter.format(cartTotal)

  const checkout = async () => {
    setCheckoutError('')
    setIsCheckingOut(true)

    try {
      const response = await fetch('/api/stripe/checkout_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trackIds: items.map(item => item.id)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to start checkout')
      }

      window.location.href = data.url
    } catch (error) {
      setCheckoutError(error.message)
      setIsCheckingOut(false)
    }
  }

  if (!session?.user) {
    return <p>You must be logged in to view the cart</p>
  }

  return (
    <Container className='mt-5 justify-content-md-center'>
      {checkoutCanceled && (
        <div className='alert alert-warning' role='alert'>
          {checkoutCanceledMessage}
        </div>
      )}
      <Row>
        <Col />
        <Col xs={12} md={9} lg={6} xl={5} xxl={5}>
          <Container className='bg-light border mt-5 p-3'>
            <Card>
              <Card.Body>
                <Card.Title>Shopping Cart</Card.Title>
                <Card.Subtitle className='mb-2 text-muted'>
                  Below is a list of the items in your cart.
                </Card.Subtitle>
                {items.length > 0 ? (
                  <>
                    <Card.Text>
                      Please check your items before purchasing. Use the
                      &#39;X&#39; on the right to remove items from the
                      cart. When you are ready to buy, click &#39;Buy
                      Now&#39;.
                    </Card.Text>
                    <hr />
                    {items.map(item => (
                      <Container
                        className='border border-info mb-3'
                        key={item.id}
                      >
                        <ListGroup variant='flush'>
                          <ListGroup.Item>
                            <h5>
                              &quot;
                              <Link href={`/catalogue/${item.id}`}>
                                {item.title}
                              </Link>
                              &quot;
                            </h5>
                            &nbsp;&nbsp;&nbsp;By &nbsp;&nbsp;{item.composer}
                          </ListGroup.Item>
                          <Row>
                            <Col>
                              <ListGroup.Item className='mt-3 border-0'>
                                {item.formattedPrice}
                              </ListGroup.Item>
                            </Col>
                            <Col md={3}>
                              <ListGroup.Item className='mt-3 border-0'>
                                <CloseButton
                                  onClick={() => removeItem(item.id)}
                                />
                              </ListGroup.Item>
                            </Col>
                          </Row>
                        </ListGroup>
                      </Container>
                    ))}
                  </>
                ) : (
                  <>
                    <Card.Text className='primary'>
                      Your cart is empty!
                    </Card.Text>
                    <Card.Text>
                      Please got to the{' '}
                      <Link href='/catalogue' className='text-primary'>
                        CATALOGUE
                      </Link>{' '}
                      to add tracks to your cart
                    </Card.Text>
                  </>
                )}
                <Card.Text className='p-2 bg-info text-white'>
                  Total = {total}
                </Card.Text>
                {checkoutError && (
                  <Card.Text className='p-2 bg-danger text-white'>
                    {checkoutError}
                  </Card.Text>
                )}
              </Card.Body>
            </Card>
            <Button
              onClick={checkout}
              className='btn btn-info mt-3 text-white'
              disabled={items.length === 0 || isCheckingOut}
            >
              {isCheckingOut ? 'Redirecting...' : 'Buy Now'}
            </Button>
          </Container>
        </Col>
        <Col />
      </Row>
    </Container>
  )
}

export default CartPageContent
