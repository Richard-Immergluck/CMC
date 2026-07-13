import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import ProfilePageContent from '../../components/features/profile/ProfilePageContent'
import { formatDisplayDate } from '../../lib/date-format.mjs'
import { authOptions } from '../../lib/server/auth'
import prisma from '../../lib/server/prisma'

export const dynamic = 'force-dynamic'

const trackSelect = {
  id: true,
  fileName: true,
  title: true,
  composer: true,
  status: true,
  moderationStatus: true,
  processingStatus: true,
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
  additionalInfo: true,
  _count: {
    select: {
      Comments: true,
      TrackRequests: true
    }
  }
}

const serializeTrack = track => {
  const {
    _count: count,
    ...trackFields
  } = track

  return {
    ...trackFields,
    commentCount: count?.Comments || 0,
    requestCount: count?.TrackRequests || 0,
    uploadedAt: formatDisplayDate(track.uploadedAt)
  }
}

const serializePurchasedTrack = purchase => ({
  ...serializeTrack(purchase.track),
  purchasedAt: formatDisplayDate(purchase.purchasedAt),
  sourceReleaseId: purchase.sourceReleaseId,
  sourceReleaseTitle: purchase.sourceReleaseTitle
})

const serializeComment = comment => ({
  id: comment.id,
  content: comment.content,
  createdAt: formatDisplayDate(comment.createdAt),
  trackId: comment.trackId,
  trackTitle: comment.track.title,
  trackUserId: comment.track.userId
})

const serializeTrackRequest = request => ({
  ...request,
  createdAt: formatDisplayDate(request.createdAt),
  updatedAt: formatDisplayDate(request.updatedAt)
})

const serializeOwnerTrackRequest = request => ({
  id: request.id,
  composer: request.composer,
  createdAt: formatDisplayDate(request.createdAt),
  currentResponse: request.responses?.[0]
    ? {
        id: request.responses[0].id,
        pricePence: request.responses[0].pricePence,
        pricingReviewStatus: request.responses[0].pricingReviewStatus,
        status: request.responses[0].status
      }
    : null,
  fulfilledByTrack: request.fulfilledByTrack
    ? {
        id: request.fulfilledByTrack.id,
        title: request.fulfilledByTrack.title,
        moderationStatus: request.fulfilledByTrack.moderationStatus,
        processingStatus: request.fulfilledByTrack.processingStatus,
        status: request.fulfilledByTrack.status
      }
    : null,
  instrumentation: request.instrumentation,
  notes: request.notes,
  requestedBy: request.requestedBy?.name || request.requestedBy?.email || 'CMC member',
  status: request.status,
  title: request.title,
  track: request.track
    ? {
        id: request.track.id,
        title: request.track.title,
        composer: request.track.composer
      }
    : null,
  trackId: request.trackId,
  updatedAt: formatDisplayDate(request.updatedAt)
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

  const [uploadedTracks, purchases, comments, trackRequests, ownerTrackRequests, wishlistItems] = await Promise.all([
    prisma.track.findMany({
      where: {
        moderationStatus: 'APPROVED',
        processingStatus: 'READY',
        status: 'PUBLISHED',
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
    }),
    prisma.comment.findMany({
      where: {
        userId: currentUser.id
      },
      include: {
        track: {
          select: {
            id: true,
            title: true,
            userId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 8
    }),
    prisma.trackRequest.findMany({
      where: {
        userId: currentUser.id
      },
      include: {
        track: {
          select: {
            id: true,
            title: true,
            userId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 8
    }),
    prisma.trackRequest.findMany({
      where: {
        OR: [
          {
            track: {
              userId: currentUser.id
            }
          },
          {
            responses: {
              some: {
                respondedById: currentUser.id,
                status: {
                  in: ['ACCEPTED', 'COMPLETED']
                }
              }
            }
          }
        ]
      },
      include: {
        fulfilledByTrack: {
          select: {
            id: true,
            moderationStatus: true,
            processingStatus: true,
            status: true,
            title: true
          }
        },
        requestedBy: {
          select: {
            email: true,
            name: true
          }
        },
        track: {
          select: {
            composer: true,
            id: true,
            title: true
          }
        },
        responses: {
          where: {
            respondedById: currentUser.id
          },
          select: {
            id: true,
            pricePence: true,
            pricingReviewStatus: true,
            status: true
          },
          take: 1
        }
      },
      orderBy: [
        {
          updatedAt: 'desc'
        },
        {
          createdAt: 'desc'
        }
      ],
      take: 8
    }),
    prisma.wishlistItem.findMany({
      where: {
        userId: currentUser.id
      },
      include: {
        track: {
          select: trackSelect
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 8
    })
  ])

  return {
    currentUser,
    ownerTrackRequests: ownerTrackRequests.map(serializeOwnerTrackRequest),
    userComments: comments.map(serializeComment),
    userPurchasedTracks: purchases.map(serializePurchasedTrack),
    userTrackRequests: trackRequests.map(serializeTrackRequest),
    userWishlistedTracks: wishlistItems.map(item => ({
      ...serializeTrack(item.track),
      savedAt: formatDisplayDate(item.createdAt)
    })),
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
  const requestedLibraryTab = ['downloads', 'uploads'].includes(query?.library) ? query.library : null
  const focusedTrackId = Number.parseInt(query?.focusTrackId || '', 10)

  return (
    <ProfilePageContent
      checkout={query?.checkout || null}
      checkoutSessionId={query?.session_id || null}
      currentUser={profile.currentUser}
      focusedTrackId={Number.isInteger(focusedTrackId) ? focusedTrackId : null}
      initialLibraryTab={requestedLibraryTab}
      purchase={query?.purchase || null}
      userComments={profile.userComments}
      ownerTrackRequests={profile.ownerTrackRequests}
      userPurchasedTracks={profile.userPurchasedTracks}
      userTrackRequests={profile.userTrackRequests}
      userUploadedTracks={profile.userUploadedTracks}
      userWishlistedTracks={profile.userWishlistedTracks}
      wishlist={query?.wishlist || null}
    />
  )
}

export default ProfilePage
