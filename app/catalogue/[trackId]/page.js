import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import CatalogueTrackDetailContent from '../../../components/features/catalogue/CatalogueTrackDetailContent'
import { getCatalogueContext } from '../../../lib/catalogue-view.mjs'
import { formatDisplayDate } from '../../../lib/date-format.mjs'
import { authOptions } from '../../../lib/server/auth'
import { getCurrentUser } from '../../../lib/server/ownership'
import prisma from '../../../lib/server/prisma'
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
      TrackOwner: true
    }
  }
}

const getTrackDetail = async trackId => {
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
        status: true,
        createdAt: true,
        userId: true,
        requestedBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  ])

  return {
    comments: comments.map(comment => ({
      content: comment.content,
      createdAt: formatDisplayDate(comment.createdAt),
      id: comment.id,
      userId: comment.userId,
      userName: comment.postedBy?.name || 'Unknown'
    })),
    requests: requests.map(request => ({
      createdAt: formatDisplayDate(request.createdAt),
      description: request.notes || 'No additional request notes supplied.',
      id: request.id,
      requestedBy: request.requestedBy?.name || request.requestedBy?.email || 'CMC member',
      status: request.status,
      title: request.title,
      userId: request.userId
    })),
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

  const detail = await getTrackDetail(trackId)

  if (!detail) {
    notFound()
  }
  const ownership = currentUser
    ? await prisma.trackOwner.findUnique({
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
    : null

  return (
    <CatalogueTrackDetailContent
      catalogueContext={getCatalogueContext(currentUser)}
      comments={detail.comments}
      requests={detail.requests}
      track={{
        ...detail.track,
        viewerState: {
          isOwned: Boolean(ownership),
          isUploadedByViewer: Boolean(currentUser && detail.track.userId === currentUser.id)
        }
      }}
    />
  )
}

export default CatalogueTrackDetailPage
