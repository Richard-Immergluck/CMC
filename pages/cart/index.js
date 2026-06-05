import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useCart } from 'react-use-cart'
import Link from 'next/link'
import {
  Container,
  Card,
  ListGroup,
  Row,
  Col,
  CloseButton,
  Button
} from 'react-bootstrap'

function Cart() {
  const [checkoutError, setCheckoutError] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // Retrieve the user from the session
  const { data: session } = useSession()

  // useCart hook
  const { removeItem, cartTotal, items } = useCart()

  // Format function for cart total
  var formatter = new Intl.NumberFormat('en-UK', {
    style: 'currency',
    currency: 'GBP'
  })

  var total = formatter.format(cartTotal)

  // ------ START OF CHECKOUT FUNCTION ------
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
  // --- END of Checkout ---
  
  if (session && session.user) {
    return (
      <>
        <Container className='mt-5 justify-content-md-center'>
          <Row>
            <Col></Col>
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
                                  <Link href={`./catalogue/${item.id}`}>
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
                                    ></CloseButton>
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
              <Col></Col>
            </Row>

        </Container>
      </>
    )
  } else {
    return (
      <>
        <p>You must be logged in to view the cart</p>
      </>
    )
  }
}

export default Cart
