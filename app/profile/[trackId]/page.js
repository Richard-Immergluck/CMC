import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import ProfileTrackDetailContent from '../../../components/features/profile/ProfileTrackDetailContent'
import { formatDisplayDate } from '../../../lib/date-format.mjs'
import { canAccessFullTrack, getCurrentUser } from '../../../lib/server/ownership'
import prisma from '../../../lib/server/prisma'
import { authOptions } from '../../../lib/server/auth'

export const dynamic = 'force-dynamic'

const parseTrackIdSlug = value => {
  const [rawTrackId] = String(value || '').split('-')
  const trackId = Number(rawTrackId)
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
  additionalInfo: true
}

const getTrackDetail = async trackId => {
  const track = await prisma.track.findUnique({
    where: {
      id: trackId
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
      createdAt: formatDisplayDate(comment.createdAt),
      id: comment.id,
      userName: comment.postedBy?.name || 'Unknown'
    })),
    track: {
      ...track,
      uploadedAt: formatDisplayDate(track.uploadedAt),
      uploaderName: uploader?.name || 'Unknown'
    }
  }
}

const ProfileTrackDetailPage = async ({ params }) => {
  const session = await getServerSession(authOptions)
  const currentUser = await getCurrentUser(session)

  if (!currentUser) {
    redirect('/auth/signin?callbackUrl=/profile')
  }

  const { trackId: rawTrackId } = await params
  const trackId = parseTrackIdSlug(rawTrackId)

  if (!trackId) {
    notFound()
  }

  const { allowed } = await canAccessFullTrack({
    userId: currentUser.id,
    trackId
  })

  if (!allowed) {
    notFound()
  }

  const detail = await getTrackDetail(trackId)

  if (!detail) {
    notFound()
  }

  return (
    <ProfileTrackDetailContent
      comments={detail.comments}
      track={detail.track}
    />
  )
}

export default ProfileTrackDetailPage
