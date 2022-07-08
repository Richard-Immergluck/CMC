import React from 'react'
import { useCart } from 'react-use-cart'
import Link from 'next/link'
import prisma from '/components/prisma'

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

  // Format function for the cart total
  var formatter = new Intl.NumberFormat('en-UK', {
    style: 'currency',
    currency: 'GBP'
  })

  var total = formatter.format(cartTotal)

  // --- START of Checkout ---
  const checkout = async () => {
    // Check cart values against DB
    for (var arrayObject = 0; arrayObject < items.length; arrayObject++) {
      // First, find the track in the DB
      for (var trackObject = 0; trackObject < tracks.length; trackObject++) {
        if (tracks[trackObject].id === items[arrayObject].id) {
          // console.log('track id is ===>', tracks[trackObject].id, 'and track price is ==>', tracks[trackObject].price)

          // Then compare the prices
          if (tracks[trackObject].price !== items[arrayObject].price) {
            alert(
              'Sorry, the prices have changed. The cart will now be emptied and items will need to be added again - apologies for the inconvenience.'
            )
            emptyCart()
            return
          } else {
            console.log('price check passed')
          }
        }
      }
    }

    // Stripe checkout

    // Create DB Submission assigning the cart items to the user

    // // Iterate over cart items for DB submission
    // for (var arrayObject = 0; arrayObject < items.length; arrayObject++) {
    //   // Create the submission object
    //   var trackID = items[arrayObject].id
      
      const submissionData = 
        // trackID,
        items
    

      // Send the submission object to the api endpoint
      const response = await fetch('/api/cart', {
        method: 'POST',
        body: JSON.stringify(submissionData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      alert("You've just bought some tracks!")

      return await response.json()
      
    // }
    
  } // --- END of Checkout ---

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
