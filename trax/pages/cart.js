import React, { useEffect, useState } from 'react'
import { useCart } from 'react-use-cart'
import Link from 'next/link'
import prisma from '/components/prisma'
// import { loadStripe } from '@stripe/stripe-js'

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

    const lineitemsBody = JSON.stringify({

    })

    console.log(lineitemsBody)

    // const stripeSubmissionData = items

    // const stripeResponse = await fetch('/api/stripe', {
    //   method: 'POST',
    //   body: JSON.stringify(stripeSubmissionData),
    //   headers: {
    //     'Content-Type': 'application/json'
    //   }
    // })

    // return await stripeResponse.json()
    // --- END Stripe Checkout ---

    // --- Update DB with purchsed tracks ---
    // Send the submission object to the api endpoint
    // to update DB with purchase info
    // const submissionData = items
    // const response = await fetch('/api/cart', {
    //   method: 'POST',
    //   body: JSON.stringify(submissionData),
    //   headers: {
    //     'Content-Type': 'application/json'
    //   }
    // })

    // return await response.json()
    // }
    // --- END update DB with purchased tracks ---
  }
  // --- END of Checkout ---

  return (
    <div className='ms-2'>
      <br />
      <br />
      <button onClick={emptyCart}>Empty Cart</button>
      {items.map(item => (
        <div className='flex items-centre' key={item.id}>
          <hr />
          <div>
            <Link href={`./catalogue/${item.id}`}>
              <a>{item.title}</a>
            </Link>
          </div>
          <div>{item.composer}</div>
          <div>{item.formattedPrice}</div>
          <button onClick={() => removeItem(item.id)}>Remove Item</button>
          <hr />
        </div>
      ))}
      <p>Total = {total}</p>
      <button onClick={checkout} className='btn btn-primary ms-2'>
        Buy Now
      </button>
    </div>
  )
}

export default Cart
