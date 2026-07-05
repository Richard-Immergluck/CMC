import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '../../../lib/server/auth'
import { getCurrentUser } from '../../../lib/server/ownership'
import prisma from '../../../lib/server/prisma'
import { publicTrackWhere } from '../../../lib/server/tracks-core.mjs'

export const dynamic = 'force-dynamic'

const parseTrackId = value => {
  const trackId = Number(value)

  return Number.isInteger(trackId) && trackId > 0 ? trackId : null
}

const getWishlistIntentPath = trackId => `/wishlist/add?trackId=${trackId}`

const AddWishlistPage = async ({ searchParams }) => {
  const query = await searchParams
  const trackId = parseTrackId(query?.trackId)

  if (!trackId) {
    redirect('/profile?wishlist=invalid')
  }

  const session = await getServerSession(authOptions)
  const currentUser = await getCurrentUser(session)

  if (!currentUser) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(getWishlistIntentPath(trackId))}`)
  }

  const track = await prisma.track.findFirst({
    where: {
      id: trackId,
      ...publicTrackWhere
    },
    select: {
      id: true
    }
  })

  if (!track) {
    redirect('/profile?wishlist=missing')
  }

  await prisma.wishlistItem.upsert({
    where: {
      trackId_userId: {
        trackId,
        userId: currentUser.id
      }
    },
    create: {
      trackId,
      userId: currentUser.id
    },
    update: {}
  })

  redirect('/profile?wishlist=added')
}

export default AddWishlistPage
