'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Music2, ShieldCheck, Trash2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useCart } from 'react-use-cart'
import BrandDisplayText from '../../brand/BrandDisplayText'
import { Button } from '../../ui/primitives'

const checkoutCanceledMessage = 'Checkout was cancelled. Your cart has been kept so you can review it or try again when you are ready.'

const formatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP'
})

const formatItemPrice = item => {
  if (typeof item.formattedPrice === 'string') {
    return item.formattedPrice.replace(/^GBP\s+/, '£')
  }

  if (Number.isFinite(item.price)) {
    return formatter.format(item.price)
  }

  return '£0.00'
}

const getCartItemHref = item => {
  if (item.itemType === 'release' && item.releaseId) {
    return `/works-collections/${item.releaseId}`
  }

  return `/catalogue/${item.trackId || item.id}`
}

const getCartItemTypeLabel = item => {
  if (item.itemType === 'release') {
    return item.trackCount === 1 ? '1 track collection' : `${item.trackCount || 0} track collection`
  }

  return 'Individual track'
}

const CartPageContent = () => {
  const [checkoutError, setCheckoutError] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [cartMounted, setCartMounted] = useState(false)
  const searchParams = useSearchParams()
  const checkoutCanceled = searchParams.get('checkout') === 'canceled'
  const { data: session } = useSession()
  const { removeItem, cartTotal, items } = useCart()
  const visibleItems = cartMounted ? items : []
  const total = formatter.format(cartMounted ? cartTotal : 0)

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setCartMounted(true)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [])

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
          releaseIds: items
            .filter(item => item.itemType === 'release')
            .map(item => item.releaseId),
          trackIds: items
            .filter(item => item.itemType !== 'release')
            .map(item => item.trackId || item.id)
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
    return (
      <main className='cmc-cart-page'>
        <div className='container'>
          <section className='cmc-cart-auth-panel' aria-labelledby='cart-auth-heading'>
            <p className='cmc-cart-kicker'>Member checkout</p>
            <h1 id='cart-auth-heading'>Sign in to view your cart</h1>
            <p>
              Your selected tracks are held in your browser. Sign in to complete checkout and attach purchases to your downloads.
            </p>
            <Button as={Link} href='/auth/signin?callbackUrl=/cart' variant='ink'>
              Sign in
            </Button>
          </section>
        </div>
      </main>
    )
  }

  const hasItems = visibleItems.length > 0

  return (
    <main className='cmc-cart-page'>
      <div className='container'>
        <section className='cmc-cart-board' aria-labelledby='cart-heading'>
          <header className='cmc-cart-header'>
            <div className='cmc-cart-staff' aria-hidden='true' />
            <div className='cmc-cart-paper' aria-hidden='true' />
            <div className='cmc-cart-heading'>
              <p className='cmc-cart-kicker'>Checkout ledger</p>
              <h1 id='cart-heading'>
                <BrandDisplayText text='Shopping Cart' />
              </h1>
              <p>
                Check the tracks, licence and creator details before checkout.
              </p>
            </div>
          </header>

          {checkoutCanceled && (
            <div className='cmc-cart-notice cmc-cart-notice--warning' role='alert'>
              {checkoutCanceledMessage}
            </div>
          )}

          <div className='cmc-cart-layout'>
            <section className='cmc-cart-items' aria-label='Tracks in cart'>
              <div className='cmc-cart-items-header'>
                <span>Track</span>
                <span>Licence</span>
                <span>Price</span>
                <span className='cmc-sr-only'>Remove</span>
              </div>

              {hasItems ? (
                <ul className='cmc-cart-list'>
                  {visibleItems.map((item, index) => (
                    <li className='cmc-cart-item' key={item.id}>
                      <span className='cmc-cart-item-index'>{String(index + 1).padStart(2, '0')}</span>
                      <div className='cmc-cart-item-track'>
                        <Link href={getCartItemHref(item)}>
                          {item.title}
                        </Link>
                        <span>{item.composer || 'Unknown composer'}</span>
                      </div>
                      <span className='cmc-cart-item-licence'>{getCartItemTypeLabel(item)}</span>
                      <span className='cmc-cart-item-price'>{formatItemPrice(item)}</span>
                      <button
                        aria-label={`Remove ${item.title} from cart`}
                        className='cmc-cart-remove'
                        onClick={() => removeItem(item.id)}
                        type='button'
                      >
                        <Trash2 aria-hidden='true' strokeWidth={1.8} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className='cmc-cart-empty'>
                  <Music2 aria-hidden='true' strokeWidth={1.7} />
                  <h2>Your cart is empty</h2>
                  <p>Browse the archive and add rehearsal tracks when you are ready.</p>
                  <Button as={Link} href='/catalogue' variant='paper'>
                    Browse Archive
                  </Button>
                </div>
              )}
            </section>

            <aside className='cmc-cart-summary' aria-label='Order summary'>
              <p className='cmc-cart-kicker'>Order summary</p>
              <dl>
                <div>
                  <dt>{visibleItems.length === 1 ? '1 track' : `${visibleItems.length} tracks`}</dt>
                  <dd>{total}</dd>
                </div>
                <div>
                  <dt>Platform fees</dt>
                  <dd>{formatter.format(0)}</dd>
                </div>
                <div className='cmc-cart-summary-total'>
                  <dt>Total</dt>
                  <dd>{total}</dd>
                </div>
              </dl>

              {checkoutError && (
                <p className='cmc-cart-notice cmc-cart-notice--error' role='alert'>
                  {checkoutError}
                </p>
              )}

              <Button
                className='cmc-cart-checkout'
                disabled={!hasItems || isCheckingOut}
                onClick={checkout}
                variant='ink'
              >
                {isCheckingOut ? 'Redirecting...' : 'Buy Now'}
              </Button>

              <Button as={Link} href='/catalogue' variant='paper'>
                Continue Browsing
              </Button>

              <p className='cmc-cart-secure'>
                <ShieldCheck aria-hidden='true' strokeWidth={1.8} />
                Secure checkout via Stripe. Purchased tracks appear in your downloads after payment.
              </p>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}

export default CartPageContent
