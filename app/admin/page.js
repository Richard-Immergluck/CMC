import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import AdminConsoleContent from '../../components/features/admin/AdminConsoleContent'
import {
  toAdminSummary,
  toTrackReviewItem,
  toUploadBatchAdminItem,
  toWorksCollectionAdminItem,
  toUserAdminItem
} from '../../lib/server/admin-core.mjs'
import { getAdminOperationsData } from '../../lib/server/admin-operations'
import { getAdminPricingReviews } from '../../lib/server/admin-pricing-reviews.mjs'
import { uploadBatchStatuses } from '../../lib/server/upload-batches-core.mjs'
import {
  canAccessAdminSurface,
  canAccessSupportSurface
} from '../../lib/server/permissions.mjs'
import { formatDisplayDate } from '../../lib/date-format.mjs'
import prisma from '../../lib/server/prisma'
import { authOptions } from '../../lib/server/auth'

export const dynamic = 'force-dynamic'

const toCurrentUserPayload = user => user
  ? {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  : null

const serializeOperations = operations => JSON.parse(JSON.stringify(operations))

const getAdminInitialData = async currentUser => {
  const canManageUsers = canAccessAdminSurface(currentUser)
  const [
    userCount,
    trackCount,
    pendingTrackCount,
    orderCount,
    paymentEventCount,
    auditEventCount,
    uploadBatchCount,
    submittedUploadBatchCount,
    uploadBatchesNeedingAttentionCount,
    tracks,
    uploadBatches,
    worksCollections,
    users,
    pricingReviews,
    operations
  ] = await Promise.all([
    prisma.user.count(),
    prisma.track.count(),
    prisma.track.count({
      where: {
        moderationStatus: 'PENDING'
      }
    }),
    prisma.order.count(),
    prisma.paymentEvent.count(),
    prisma.auditEvent.count(),
    prisma.uploadBatch.count(),
    prisma.uploadBatch.count({
      where: {
        status: uploadBatchStatuses.submitted
      }
    }),
    prisma.uploadBatch.count({
      where: {
        status: uploadBatchStatuses.partiallyFailed
      }
    }),
    prisma.track.findMany({
      where: {
        moderationStatus: 'PENDING'
      },
      include: {
        uploadBatch: {
          select: {
            id: true,
            label: true,
            status: true,
            _count: {
              select: {
                tracks: true
              }
            }
          }
        },
        uploadedBy: true
      },
      orderBy: [
        {
          uploadedAt: 'asc'
        }
      ],
      take: 100
    }),
    prisma.uploadBatch.findMany({
      include: {
        _count: {
          select: {
            tracks: true
          }
        },
        tracks: {
          orderBy: {
            uploadedAt: 'desc'
          },
          select: {
            id: true,
            title: true,
            status: true,
            moderationStatus: true,
            processingStatus: true,
            uploadedAt: true
          }
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    }),
    prisma.catalogueRelease.findMany({
      include: {
        _count: {
          select: {
            orderItems: true,
            tracks: true
          }
        },
        tracks: {
          orderBy: {
            position: 'asc'
          },
          take: 4,
          include: {
            track: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    }),
    canManageUsers
      ? prisma.user.findMany({
          orderBy: [
            {
              email: 'asc'
            }
          ],
          take: 100
        })
      : Promise.resolve([]),
    getAdminPricingReviews(),
    getAdminOperationsData()
  ])

  return {
    canManageUsers,
    initialOperations: serializeOperations(operations),
    initialPricingReviews: serializeOperations(pricingReviews),
    initialSummary: toAdminSummary({
      userCount,
      trackCount,
      pendingTrackCount,
      orderCount,
      paymentEventCount,
      auditEventCount,
      uploadBatchCount,
      submittedUploadBatchCount,
      uploadBatchesNeedingAttentionCount
    }),
    initialTracks: tracks.map(track => ({
      ...toTrackReviewItem(track),
      uploadedAt: formatDisplayDate(track.uploadedAt)
    })),
    initialUploadBatches: serializeOperations(uploadBatches.map(toUploadBatchAdminItem)),
    initialWorksCollections: serializeOperations(worksCollections.map(toWorksCollectionAdminItem)),
    initialUsers: users.map(toUserAdminItem)
  }
}

const AdminPage = async () => {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/auth/signin?callbackUrl=/admin')
  }

  const currentUser = await prisma.user.findUnique({
    where: {
      email: session.user.email
    }
  })

  if (!canAccessSupportSurface(currentUser)) {
    return (
      <AdminConsoleContent
        currentUser={toCurrentUserPayload(currentUser)}
        forbidden
      />
    )
  }

  const initialData = await getAdminInitialData(currentUser)

  return (
    <AdminConsoleContent
      currentUser={toCurrentUserPayload(currentUser)}
      forbidden={false}
      {...initialData}
    />
  )
}

export default AdminPage
