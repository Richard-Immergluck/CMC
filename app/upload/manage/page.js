import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import UploadManagementPageContent from '../../../components/features/upload-management/UploadManagementPageContent'
import { canStartTrackUpload } from '../../../lib/access-control.mjs'
import { formatDisplayDate } from '../../../lib/date-format.mjs'
import { authOptions } from '../../../lib/server/auth'
import prisma from '../../../lib/server/prisma'
import {
  listUserWorksCollections,
  serializeWorksCollection
} from '../../../lib/server/works-collections.mjs'

export const dynamic = 'force-dynamic'

const trackSelect = {
  id: true,
  title: true,
  composer: true,
  status: true,
  moderationStatus: true,
  processingStatus: true,
  uploadedAt: true,
  userId: true,
  pricePence: true,
  formattedPrice: true,
  key: true,
  instrumentation: true,
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

const serializeUploadManagementWorksCollection = collection => ({
  ...serializeWorksCollection(collection),
  createdAt: formatDisplayDate(collection.createdAt)
})

const getUploadManagementData = async email => {
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

  if (!currentUser || !canStartTrackUpload(currentUser)) {
    return null
  }

  const [uploadedTracks, worksCollections] = await Promise.all([
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
    listUserWorksCollections({
      userId: currentUser.id
    })
  ])

  return {
    currentUser,
    userUploadedTracks: uploadedTracks.map(serializeTrack),
    userWorksCollections: worksCollections.map(serializeUploadManagementWorksCollection)
  }
}

const UploadManagementPage = async () => {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/auth/signin?callbackUrl=/upload/manage')
  }

  const uploadManagement = await getUploadManagementData(session.user.email)

  if (!uploadManagement) {
    redirect('/auth/signin?callbackUrl=/upload/manage')
  }

  return (
    <UploadManagementPageContent
      currentUser={uploadManagement.currentUser}
      userUploadedTracks={uploadManagement.userUploadedTracks}
      userWorksCollections={uploadManagement.userWorksCollections}
    />
  )
}

export default UploadManagementPage
