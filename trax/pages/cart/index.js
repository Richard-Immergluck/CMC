import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useCart } from 'react-use-cart'
import Link from 'next/link'
import prisma from '../../components/prisma'
import {
  Container,
  Card,
  ListGroup,
  Row,
  Col,
  CloseButton,
  Button
} from 'react-bootstrap'

// Retrieve all the tracks from the DB
export const getStaticProps = async () => {
  const tracks = await prisma.track.findMany({
    select: {
      id: true,
      price: true
    }
  })

  return {
    props: {
      tracks
    }
  }
}

function Cart({ tracks }) {
  const [manipulationTest, setManipulationCheckTest] = useState(true)
  const [alreadyPurchasedTest, setAlreadyPurchasedTest] = useState(true)

  // Retrieve the user from the session
  const { data: session } = useSession()

  // useCart hook
  const { emptyCart, removeItem, cartTotal, items } = useCart()

  // Format function for cart total
  var formatter = new Intl.NumberFormat('en-UK', {
    style: 'currency',
    currency: 'GBP'
  })

  var total = formatter.format(cartTotal)

  // ------ START OF CHECKOUT FUNCTION ------
  const checkout = async () => {
    // --- START Manipulation Check ---
    // Loop through cart items
    for (var arrayObject = 0; arrayObject < items.length; arrayObject++) {
      // For each cart item, loop through DB tracks
      for (var trackObject = 0; trackObject < tracks.length; trackObject++) {
        // Match the cart item ID to the DB track ID
        if (tracks[trackObject].id === items[arrayObject].id) {
          // If there is a match, compare the prices
          if (tracks[trackObject].price !== items[arrayObject].price) {
            alert(
              `Sorry, but the price for ${items[arrayObject].title} 
              have changed. The cart will now be emptied and items will 
              need to be added again - apologies for the inconvenience.`
            )
            emptyCart()
            setManipulationCheckTest(false)

            return
          } else {
            console.log('price check passed')
          }
        }
      }
    }
    // --- END manipulation check ---

    // --- START already owned track check ---
    // GET request for tracks owned by user
    const getUserTracks = await fetch('/api/cart', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const userTracksObject = await getUserTracks.json()

    // Empty array to store tracks owned by user
    const alreadyPurchasedArray = []

    // Loop through cart items
    for (var arrayObject = 0; arrayObject < items.length; arrayObject++) {
      // For each cart item, loop through DB tracks
      for (
        var trackObject = 0;
        trackObject < userTracksObject.length;
        trackObject++
      ) {
        // Match the cart item ID to the DB track ID
        if (userTracksObject[trackObject].trackId === items[arrayObject].id) {
          alreadyPurchasedArray.push(items[arrayObject])
        }
      }
    }

    // Create message if user has already purchased the track
    // First check if the matchedItemArray is empty
    if (alreadyPurchasedArray.length === 0) {
      console.log('matched item check passed')
    } else {
      // If there is one matched item
      if (alreadyPurchasedArray.length === 1) {
        alert(
          `Sorry, but "${alreadyPurchasedArray[0].title} by ${alreadyPurchasedArray[0].composer}" has already been purchased. Please revise your shopping cart.`
        )
        setAlreadyPurchasedTest(false)
        return
      }
      // If there are multiple matched items
      if (alreadyPurchasedArray.length > 1) {
        var itemList = ``
        for (
          var arrayObject = 0;
          arrayObject < alreadyPurchasedArray.length;
          arrayObject++
        ) {
          itemList += `"${alreadyPurchasedArray[arrayObject].title} by ${alreadyPurchasedArray[arrayObject].composer}", `
        }
        alert(
          `Sorry, but the following items have already been purchased: ${itemList} Please revise your shopping cart.`
        )
        setAlreadyPurchasedTest(false)
        return
      }
    }
    // ------ END already owned check ------

    // // Stripe Logic here
    // if (manipulationTest && alreadyPurchasedTest) {...}

    // If both checks pass, then update the DB
    if (manipulationTest && alreadyPurchasedTest) {
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tracks: items
          })
        })
        const data = await response.json()
        alert('Thank you for your purchase!')
      } catch (error) {
        console.log(error)
      }

      // Empty the cart
      emptyCart()

      // Redirect to the user's profile page
      window.location.href = '/profile'
    } else {
      console.log('checkout failed')
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
                  </Card.Body>
                </Card>
                <Button
                  onClick={checkout}
                  className='btn btn-info mt-3 text-white'
                  disabled={items.length === 0}
                >
                  Buy Now
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
