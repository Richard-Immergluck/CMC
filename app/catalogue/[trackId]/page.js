import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import CatalogueTrackDetailContent from '../../../components/features/catalogue/CatalogueTrackDetailContent'
import { getCatalogueContext } from '../../../lib/catalogue-view.mjs'
import { formatDisplayDate } from '../../../lib/date-format.mjs'
import { authOptions } from '../../../lib/server/auth'
import { getCurrentUser } from '../../../lib/server/ownership'
import prisma from '../../../lib/server/prisma'
import { isTrackRequestExpired } from '../../../lib/server/request-responses.mjs'
import { publicTrackWhere } from '../../../lib/server/tracks-core.mjs'

export const dynamic = 'force-dynamic'

const parseTrackIdParam = value => {
  const trackId = Number(value)
  return Number.isInteger(trackId) && trackId > 0 ? trackId : null
}

const trackSelect = {
  id: true,
  fileName: true,
  title: true,
  composer: true,
  uploadedAt: true,
  userId: true,
  previewFileName: true,
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
      TrackOwner: true,
      TrackRequests: true
    }
  }
}

const getTrackDetail = async (trackId, currentUser = null) => {
  const track = await prisma.track.findFirst({
    where: {
      id: trackId,
      ...publicTrackWhere
    },
    select: trackSelect
  })

  if (!track) {
    return null
  }

  const [uploader, comments, requests] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: track.userId
      },
      select: {
        name: true
      }
    }),
    prisma.comment.findMany({
      where: {
        trackId
      },
      select: {
        id: true,
        userId: true,
        content: true,
        createdAt: true,
        postedBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    }),
    prisma.trackRequest.findMany({
      where: {
        trackId
      },
      select: {
        id: true,
        title: true,
        notes: true,
        rejectionNote: true,
        rejectionReason: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        userId: true,
        requestedBy: {
          select: {
            name: true,
            email: true
          }
        },
        fulfilledByTrack: {
          select: {
            id: true,
            title: true,
            moderationStatus: true,
            status: true
          }
        },
        pricingProposals: {
          select: {
            id: true,
            pricePence: true,
            currency: true,
            catalogueType: true,
            saleFormat: true,
            reviewStatus: true,
            requesterDecision: true,
            justification: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 3
        },
        responses: {
          select: {
            id: true,
            catalogueType: true,
            completedAt: true,
            createdAt: true,
            currency: true,
            fulfilledByTrack: {
              select: {
                id: true,
                moderationStatus: true,
                processingStatus: true,
                status: true,
                title: true
              }
            },
            fulfilledByTrackId: true,
            pricePence: true,
            pricingJustification: true,
            pricingReviewStatus: true,
            rejectionNote: true,
            rejectionReason: true,
            respondedBy: {
              select: {
                email: true,
                id: true,
                name: true
              }
            },
            respondedById: true,
            responseNote: true,
            saleFormat: true,
            status: true,
            updatedAt: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
  ])

  return {
    comments: comments.map(comment => ({
      content: comment.content,
      createdAt: formatDisplayDate(comment.createdAt),
      createdAtTimestamp: comment.createdAt.toISOString(),
      id: comment.id,
      isTrackOwner: comment.userId === track.userId,
      userId: comment.userId,
      userName: comment.postedBy?.name || 'Unknown'
    })),
    requests: requests.map(request => {
      const responses = request.responses.map(response => ({
        catalogueType: response.catalogueType,
        completedAt: response.completedAt ? formatDisplayDate(response.completedAt) : null,
        createdAt: formatDisplayDate(response.createdAt),
        currency: response.currency,
        fulfilledByTrack: response.fulfilledByTrack
          ? {
              id: response.fulfilledByTrack.id,
              title: response.fulfilledByTrack.title,
              moderationStatus: response.fulfilledByTrack.moderationStatus,
              processingStatus: response.fulfilledByTrack.processingStatus,
              status: response.fulfilledByTrack.status
            }
          : null,
        fulfilledByTrackId: response.fulfilledByTrackId,
        id: response.id,
        isCurrentUserResponse: Boolean(currentUser && response.respondedById === currentUser.id),
        pricePence: response.pricePence,
        pricingJustification: response.pricingJustification,
        pricingReviewStatus: response.pricingReviewStatus,
        rejectionNote: response.rejectionNote,
        rejectionReason: response.rejectionReason,
        respondedBy: response.respondedBy?.name || response.respondedBy?.email || 'CMC uploader',
        respondedById: response.respondedById,
        responseNote: response.responseNote,
        saleFormat: response.saleFormat,
        status: response.status,
        updatedAt: formatDisplayDate(response.updatedAt)
      }))
      const hasCompletedResponse = responses.some(response => response.status === 'COMPLETED') || Boolean(request.fulfilledByTrack)
      const expired = isTrackRequestExpired(request) && !hasCompletedResponse

      return {
        createdAt: formatDisplayDate(request.createdAt),
        createdAtTimestamp: request.createdAt.toISOString(),
        description: request.notes || 'No additional request notes supplied.',
        displayStatus: expired ? 'EXPIRED' : request.status,
        expiresAt: request.expiresAt ? formatDisplayDate(request.expiresAt) : null,
        fulfilledByTrack: request.fulfilledByTrack
          ? {
              id: request.fulfilledByTrack.id,
              title: request.fulfilledByTrack.title,
              moderationStatus: request.fulfilledByTrack.moderationStatus,
              status: request.fulfilledByTrack.status
            }
          : null,
        id: request.id,
        isExpired: expired,
        isRequestedByViewer: Boolean(currentUser && request.userId === currentUser.id),
        pricingProposals: request.pricingProposals.map(proposal => ({
          catalogueType: proposal.catalogueType,
          createdAt: formatDisplayDate(proposal.createdAt),
          currency: proposal.currency,
          id: proposal.id,
          justification: proposal.justification,
          pricePence: proposal.pricePence,
          requesterDecision: proposal.requesterDecision,
          reviewStatus: proposal.reviewStatus,
          saleFormat: proposal.saleFormat
        })),
        rejectionNote: request.rejectionNote,
        rejectionReason: request.rejectionReason,
        requestedBy: request.requestedBy?.name || request.requestedBy?.email || 'CMC member',
        responses,
        status: request.status,
        title: request.title,
        userId: request.userId
      }
    }),
    track: {
      ...track,
      uploadedAt: formatDisplayDate(track.uploadedAt),
      uploaderName: uploader?.name || 'Unknown'
    }
  }
}

const CatalogueTrackDetailPage = async ({ params }) => {
  const session = await getServerSession(authOptions)
  const currentUser = await getCurrentUser(session)
  const { trackId: rawTrackId } = await params
  const trackId = parseTrackIdParam(rawTrackId)

  if (!trackId) {
    notFound()
  }

  const detail = await getTrackDetail(trackId, currentUser)

  if (!detail) {
    notFound()
  }
  const [ownership, wishlistItem] = currentUser
    ? await Promise.all([
        prisma.trackOwner.findUnique({
          where: {
            trackId_userId: {
              trackId,
              userId: currentUser.id
            }
          },
          select: {
            id: true
          }
        }),
        prisma.wishlistItem.findUnique({
          where: {
            trackId_userId: {
              trackId,
              userId: currentUser.id
            }
          },
          select: {
            id: true
          }
        })
      ])
    : [null, null]

  return (
    <CatalogueTrackDetailContent
      catalogueContext={getCatalogueContext(currentUser)}
      comments={detail.comments}
      requests={detail.requests}
      track={{
        ...detail.track,
        viewerState: {
          isOwned: Boolean(ownership),
          isWishlisted: Boolean(wishlistItem),
          isUploadedByViewer: Boolean(currentUser && detail.track.userId === currentUser.id)
        }
      }}
    />
  )
}

export default CatalogueTrackDetailPage
