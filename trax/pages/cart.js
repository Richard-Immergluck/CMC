import { useCart } from 'react-use-cart'
import Link from 'next/link'

function Cart() {
  const { emptyCart, removeItem, cartTotal, items } = useCart()

  const buy = () => {
    alert("You've just bought some tracks!"), emptyCart()
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
          <div>{item.price}</div>
          <button onClick={() => removeItem(item.id)}>Remove Item</button>
          <hr />
        </div>
      ))}
      <p>Total = {cartTotal}</p>
      <button onClick={buy} className='btn btn-primary ms-2'>
        Buy Now
      </button>
    </div>
  )
}

export default Cart
