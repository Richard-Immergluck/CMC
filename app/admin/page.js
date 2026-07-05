import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import AdminConsoleContent from '../../components/features/admin/AdminConsoleContent'
import {
  toAdminSummary,
  toTrackReviewItem,
  toUserAdminItem
} from '../../lib/server/admin-core.mjs'
import { getAdminOperationsData } from '../../lib/server/admin-operations'
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
    tracks,
    users,
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
    prisma.track.findMany({
      where: {
        moderationStatus: 'PENDING'
      },
      include: {
        uploadedBy: true
      },
      orderBy: [
        {
          uploadedAt: 'asc'
        }
      ],
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
    getAdminOperationsData()
  ])

  return {
    canManageUsers,
    initialOperations: serializeOperations(operations),
    initialSummary: toAdminSummary({
      userCount,
      trackCount,
      pendingTrackCount,
      orderCount,
      paymentEventCount,
      auditEventCount
    }),
    initialTracks: tracks.map(track => ({
      ...toTrackReviewItem(track),
      uploadedAt: formatDisplayDate(track.uploadedAt)
    })),
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
