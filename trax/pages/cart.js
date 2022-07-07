import React from 'react'
import { useCart } from 'react-use-cart'
import Link from 'next/link'
import prisma from '/components/prisma'

// Retrieve all the tracks from the DB
export const getStaticProps = async () => {
  const tracks = await prisma.track.findMany({
    select: {
      id: true,
      price: true,
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

  var formatter = new Intl.NumberFormat('en-UK', {
    style: 'currency',
    currency: 'GBP',
  });

  var total=formatter.format(cartTotal)

  const checkout = () => {
    alert("You've just bought some tracks!")

    // Check cart values against DB
    for (var arrayObject = 0; arrayObject < items.length; arrayObject++) {
      console.log(items[arrayObject].id)
      console.log(tracks[arrayObject].price)
    }

    console.log(tracks)
    // Create DB Submission Object
    const submissionData = {}
    // Create some fake data to send to the API
  }

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
