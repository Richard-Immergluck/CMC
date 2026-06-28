import { Suspense } from 'react'
import CartPageContent from '../../components/features/cart/CartPageContent'

const CartPage = () => (
  <Suspense fallback={null}>
    <CartPageContent />
  </Suspense>
)

export default CartPage
