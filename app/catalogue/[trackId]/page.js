import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import CatalogueTrackDetailContent from '../../../components/features/catalogue/CatalogueTrackDetailContent'
import { getCatalogueContext } from '../../../lib/catalogue-view.mjs'
import { authOptions } from '../../../lib/server/auth'
import { getCurrentUser } from '../../../lib/server/ownership'
import prisma from '../../../lib/server/prisma'
import { publicTrackWhere } from '../../../lib/server/tracks-core.mjs'

export const dynamic = 'force-dynamic'

const parseTrackIdParam = value => {
  const trackId = Number(value)
  return Number.isInteger(trackId) && trackId > 0 ? trackId : null
}

const requestTemplates = [
  {
    description: track => `A slower rehearsal pass for ${track.title}, keeping the same key and cue structure.`,
    id: 'slow-practice',
    requestedBy: 'Community request',
    status: 'Open',
    title: 'Slower practice tempo'
  },
  {
    description: track => `A reduced piano-only version for first rehearsals before moving to the full ${track.instrumentation || 'instrumentation'} backing.`,
    id: 'piano-reduction',
    requestedBy: 'Uploader follow-up',
    status: 'Planned',
    title: 'Piano reduction version'
  },
  {
    description: track => `A version transposed away from ${track.key || 'the original key'} for singers or younger players preparing the same material.`,
    id: 'alternate-key',
    requestedBy: 'Singer request',
    status: 'Open',
    title: 'Alternative key'
  },
  {
    description: track => `A shorter audition-length cut of ${track.title} with a clear opening cue and clean ending.`,
    id: 'audition-cut',
    requestedBy: 'Audition prep request',
    status: 'In review',
    title: 'Audition cut'
  },
  {
    description: track => `A click-supported version for ensemble classes that need a firmer pulse through the ${track.instrumentation || 'texture'}.`,
    id: 'click-track',
    requestedBy: 'Teacher request',
    status: 'Open',
    title: 'Click-supported practice track'
  },
  {
    description: track => `A no-click performance-feel version of ${track.title} for later-stage rehearsal.`,
    id: 'performance-feel',
    requestedBy: 'Performer request',
    status: 'Planned',
    title: 'Performance-feel version'
  },
  {
    description: track => `A sectional loop focused on the transition into the final phrase of ${track.title}.`,
    id: 'sectional-loop',
    requestedBy: 'Practice group request',
    status: 'Open',
    title: 'Sectional loop'
  },
  {
    description: track => `A simplified school rehearsal version preserving the harmonic outline of ${track.composer}.`,
    id: 'student-version',
    requestedBy: 'School ensemble request',
    status: 'Open',
    title: 'Student rehearsal version'
  }
]

const createTrackRequests = track => {
  const createdAt = track.uploadedAt.toLocaleDateString()
  const requestCount = 2 + (track.id % 3)
  const startIndex = track.id % requestTemplates.length

  return Array.from({ length: requestCount }, (_, index) => {
    const template = requestTemplates[(startIndex + index) % requestTemplates.length]

    return {
      createdAt,
      description: template.description(track),
      id: `${track.id}-${template.id}`,
      requestedBy: template.requestedBy,
      status: template.status,
      title: template.title
    }
  })
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

  const [uploader, comments] = await Promise.all([
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
    })
  ])

  return {
    comments: comments.map(comment => ({
      content: comment.content,
      createdAt: comment.createdAt.toLocaleDateString(),
      id: comment.id,
      userId: comment.userId,
      userName: comment.postedBy?.name || 'Unknown'
    })),
    requests: createTrackRequests(track),
    track: {
      ...track,
      uploadedAt: track.uploadedAt.toLocaleDateString(),
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
