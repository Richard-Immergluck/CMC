'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useCart } from 'react-use-cart'
import { Button } from '../../ui/primitives'

const WorksCollectionCartButton = ({ collection }) => {
  const { data: session } = useSession()
  const { addItem, inCart } = useCart()
  const cartId = `release-${collection.id}`
  const isInCart = inCart(cartId)

  if (!session?.user) {
    return (
      <Button as={Link} href={`/auth/signin?callbackUrl=/works-collections/${collection.id}`} variant='ink'>
        Sign in to Buy
      </Button>
    )
  }

  const addCollectionToCart = () => {
    addItem({
      id: cartId,
      itemType: 'release',
      releaseId: collection.id,
      title: collection.title,
      composer: collection.composer || 'Mixed composers',
      formattedPrice: collection.formattedPrice,
      price: (collection.pricePence || 0) / 100,
      trackCount: collection.trackCount
    })
  }

  return (
    <Button
      disabled={isInCart}
      onClick={addCollectionToCart}
      variant='ink'
    >
      {isInCart ? 'Added to Cart' : 'Add Collection to Cart'}
    </Button>
  )
}

export default WorksCollectionCartButton
