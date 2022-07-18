import React, { useEffect, useState } from 'react'
import { useCart } from 'react-use-cart'
import Link from 'next/link'
import prisma from '/components/prisma'
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
  // useCart hook
  const { emptyCart, removeItem, cartTotal, items } = useCart()

  // Format function for cart total
  var formatter = new Intl.NumberFormat('en-UK', {
    style: 'currency',
    currency: 'GBP'
  })

  var total = formatter.format(cartTotal)

  // ------ START OF CHECKOUT ------
  const checkout = async () => {
    // --- START Manipulation Check ---
    // Loop through cart items
    for (var arrayObject = 0; arrayObject < items.length; arrayObject++) {
      // For each cart item, loop through DB tracks
      for (var trackObject = 0; trackObject < tracks.length; trackObject++) {
        // Match the cart item ID to the DB track ID
        if (tracks[trackObject].id === items[arrayObject].id) {
          // Compare the prices
          if (tracks[trackObject].price !== items[arrayObject].price) {
            alert(
              `Sorry, but the item price for ${items[arrayObject].title} have changed. The cart will now be emptied and items will need to be added again - apologies for the inconvenience.`
            )
            emptyCart()
            return
          } else {
            console.log('price check passed')
          }
        }
      }
    }
    // --- END manipulation check ---

    // --- START Already purchased track check ---
    // GET request for tracks owned by user
    const getUserTracks = await fetch('/api/cart', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const userTracksObject = await getUserTracks.json()

    // Check GET request against cart items
    const matchedItemArray = []
    // Loop through cart items
    for (var arrayObject = 0; arrayObject < items.length; arrayObject++) {
      // Loop through purchased items
      for (
        var trackObject = 0;
        trackObject < userTracksObject.length;
        trackObject++
      ) {
        // Match the cart item with the purchased item
        if (userTracksObject[trackObject].trackId === items[arrayObject].id) {
          // Add the matched item to the matchedItemArray
          matchedItemArray.push(items[arrayObject])
        }
      }
    }

    // Create message if user has already purchased the track
    // First check if the matchedItemArray is empty
    if (matchedItemArray.length !== 0) {
      // If there is one matched item
      if (matchedItemArray.length === 1) {
        alert(
          `Sorry, but "${matchedItemArray[0].title} by ${matchedItemArray[0].composer}" has already been purchased. Please revise your shopping cart.`
        )
      }
      // If there are multiple matched items
      if (matchedItemArray.length > 1) {
        var itemList = ``
        for (
          var arrayObject = 0;
          arrayObject < matchedItemArray.length;
          arrayObject++
        ) {
          itemList += `"${matchedItemArray[arrayObject].title} by ${matchedItemArray[arrayObject].composer}", `
        }
        alert(
          `Sorry, but the following items have already been purchased: ${itemList} Please revise your shopping cart.`
        )
      }
    }
    // ------ END already purchased check ------

    // --- START Stripe Checkout ---

    const lineitemsBody = JSON.stringify({})

    console.log(lineitemsBody)
  }
  // --- END of Checkout ---

  return (
    <>
      <Container className='mt-5'>
        <Row>
          <Col></Col>
          <Col md={7}>
            <Card style={{ width: '25rem' }}>
              <Card.Body>
                <Card.Title>Shopping Cart</Card.Title>
                <Card.Subtitle className='mb-2 text-muted'>
                  Below is a list of the items in your cart.
                </Card.Subtitle>
                {items.length > 0 ? (
                  <>
                    <Card.Text>
                      Please check your items before purchasing. Use the
                      &#39;X&#39; on the right to remove items from the cart.
                      When you are ready to buy, click &#39;Buy Now&#39;.
                    </Card.Text>
                    <hr />
                    {items.map(item => (
                      <Container
                        className='border border-info mb-3'
                        key={item.id}
                      >
                        <ListGroup variant='flush'>
                          <ListGroup.Item>
                            <Link href={`./catalogue/${item.id}`}>
                              {item.title}
                            </Link>
                            &nbsp;by {item.composer}
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
            <Button onClick={checkout} className='btn btn-info mt-3 text-white'>
              Buy Now
            </Button>
          </Col>
          <Col></Col>
        </Row>
      </Container>
    </>
  )
}

export default Cart
