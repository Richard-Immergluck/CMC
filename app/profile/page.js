import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import ProfilePageContent from '../../components/features/profile/ProfilePageContent'
import { authOptions } from '../../lib/server/auth'
import prisma from '../../lib/server/prisma'

export const dynamic = 'force-dynamic'

const trackSelect = {
  id: true,
  fileName: true,
  title: true,
  composer: true,
  uploadedAt: true,
  userId: true,
  previewStart: true,
  previewEnd: true,
  durationSeconds: true,
  sourceContentType: true,
  price: true,
  pricePence: true,
  currency: true,
  formattedPrice: true,
  downloadName: true,
  downloadCount: true,
  key: true,
  instrumentation: true,
  additionalInfo: true
}

const serializeTrack = track => ({
  ...track,
  uploadedAt: track.uploadedAt.toLocaleDateString()
})

const getProfileData = async email => {
  const currentUser = await prisma.user.findUnique({
    where: {
      email
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      accountStatus: true,
      uploaderStatus: true
    }
  })

  if (!currentUser) {
    return null
  }

  const [uploadedTracks, purchases] = await Promise.all([
    prisma.track.findMany({
      where: {
        userId: currentUser.id
      },
      orderBy: {
        uploadedAt: 'desc'
      },
      select: trackSelect
    }),
    prisma.trackOwner.findMany({
      where: {
        userId: currentUser.id
      },
      include: {
        track: {
          select: trackSelect
        }
      },
      orderBy: {
        purchasedAt: 'desc'
      }
    })
  ])

  return {
    currentUser,
    userPurchasedTracks: purchases.map(purchase => serializeTrack(purchase.track)),
    userUploadedTracks: uploadedTracks.map(serializeTrack)
  }
}

const ProfilePage = async ({ searchParams }) => {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/auth/signin?callbackUrl=/profile')
  }

  const profile = await getProfileData(session.user.email)

  if (!profile) {
    redirect('/auth/signin?callbackUrl=/profile')
  }

  const query = await searchParams

  return (
    <ProfilePageContent
      checkout={query?.checkout || null}
      checkoutSessionId={query?.session_id || null}
      currentUser={profile.currentUser}
      purchase={query?.purchase || null}
      userPurchasedTracks={profile.userPurchasedTracks}
      userUploadedTracks={profile.userUploadedTracks}
    />
  )
}

export default ProfilePage
