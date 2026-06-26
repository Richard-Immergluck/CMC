import { getSession } from 'next-auth/react'
import React, { useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Tab,
  Table,
  Tabs
} from 'react-bootstrap'
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
import prisma from '../../lib/server/prisma'

const fetchJson = async (url, options) => {
  const response = await fetch(url, options)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

const formatDate = value => {
  if (!value) {
    return 'n/a'
  }

  return new Date(value).toLocaleString()
}

const StatusBadge = ({ value }) => {
  const variant = value === 'APPROVED' || value === 'PUBLISHED' || value === 'ACTIVE'
    ? 'success'
    : value === 'PENDING' || value === 'DRAFT'
      ? 'warning'
      : 'secondary'

  return <Badge bg={variant}>{value}</Badge>
}

const formatMoney = ({ amountTotal, currency }) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: (currency || 'gbp').toUpperCase()
  }).format((amountTotal || 0) / 100)
}

const UserAccessRow = ({ user, onSaved }) => {
  const [form, setForm] = useState({
    role: user.role,
    accountStatus: user.accountStatus,
    uploaderStatus: user.uploaderStatus
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateField = event => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    })
  }

  const save = async () => {
    setSaving(true)
    setError('')

    try {
      const data = await fetchJson(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      })
      onSaved(data.user)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr>
      <td>
        <strong>{user.name || 'Unnamed user'}</strong>
        <div className='text-muted small'>{user.email}</div>
        {error && <Alert className='mt-2 mb-0 py-1' variant='danger'>{error}</Alert>}
      </td>
      <td>
        <Form.Select size='sm' name='role' value={form.role} onChange={updateField}>
          <option value='CUSTOMER'>Customer</option>
          <option value='UPLOADER'>Uploader</option>
          <option value='SUPPORT'>Support</option>
          <option value='ADMIN'>Admin</option>
        </Form.Select>
      </td>
      <td>
        <Form.Select size='sm' name='accountStatus' value={form.accountStatus} onChange={updateField}>
          <option value='ACTIVE'>Active</option>
          <option value='SUSPENDED'>Suspended</option>
          <option value='CLOSED'>Closed</option>
        </Form.Select>
      </td>
      <td>
        <Form.Select size='sm' name='uploaderStatus' value={form.uploaderStatus} onChange={updateField}>
          <option value='NOT_REQUESTED'>Not requested</option>
          <option value='PENDING'>Pending</option>
          <option value='APPROVED'>Approved</option>
          <option value='REJECTED'>Rejected</option>
        </Form.Select>
      </td>
      <td className='text-end'>
        <Button size='sm' variant='info' disabled={saving} onClick={save}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </td>
    </tr>
  )
}

const OperationsTables = ({ operations }) => {
  const orders = operations?.orders || []
  const paymentEvents = operations?.paymentEvents || []
  const auditEvents = operations?.auditEvents || []

  return (
    <>
      <h2 className='h5 mt-2'>Recent Orders</h2>
      <Table bordered hover responsive size='sm'>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Total</th>
            <th>Items</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>
                #{order.id}
                <div className='text-muted small'>{order.stripeCheckoutSession || 'No checkout session'}</div>
              </td>
              <td>
                {order.user?.name || 'Unknown'}
                <div className='text-muted small'>{order.user?.email}</div>
              </td>
              <td><StatusBadge value={order.status} /></td>
              <td>{formatMoney(order)}</td>
              <td>{order.items.map(item => item.title).join(', ') || 'No items'}</td>
              <td>{formatDate(order.createdAt)}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan='6' className='text-center text-muted'>No orders found.</td>
            </tr>
          )}
        </tbody>
      </Table>

      <h2 className='h5 mt-4'>Recent Payment Events</h2>
      <Table bordered hover responsive size='sm'>
        <thead>
          <tr>
            <th>Event</th>
            <th>Type</th>
            <th>Order</th>
            <th>Processed</th>
          </tr>
        </thead>
        <tbody>
          {paymentEvents.map(paymentEvent => (
            <tr key={paymentEvent.id}>
              <td>{paymentEvent.stripeEventId}</td>
              <td>{paymentEvent.type}</td>
              <td>{paymentEvent.orderId ? `#${paymentEvent.orderId}` : 'n/a'}</td>
              <td>{formatDate(paymentEvent.processedAt)}</td>
            </tr>
          ))}
          {paymentEvents.length === 0 && (
            <tr>
              <td colSpan='4' className='text-center text-muted'>No payment events found.</td>
            </tr>
          )}
        </tbody>
      </Table>

      <h2 className='h5 mt-4'>Recent Audit Events</h2>
      <Table bordered hover responsive size='sm'>
        <thead>
          <tr>
            <th>Action</th>
            <th>Actor</th>
            <th>Entity</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {auditEvents.map(auditEvent => (
            <tr key={auditEvent.id}>
              <td>{auditEvent.action}</td>
              <td>
                {auditEvent.actor?.name || 'System'}
                <div className='text-muted small'>{auditEvent.actor?.email}</div>
              </td>
              <td>{auditEvent.entityType} #{auditEvent.entityId}</td>
              <td>{formatDate(auditEvent.createdAt)}</td>
            </tr>
          ))}
          {auditEvents.length === 0 && (
            <tr>
              <td colSpan='4' className='text-center text-muted'>No audit events found.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  )
}

const TrackReviewRow = ({ track, onModerate }) => {
  const [reviewUrl, setReviewUrl] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [error, setError] = useState('')

  const loadReviewAudio = async () => {
    setLoadingPreview(true)
    setError('')

    try {
      const data = await fetchJson(`/api/tracks/${track.id}/signed-url?mode=review`)
      setReviewUrl(data.url)
    } catch (previewError) {
      setError(previewError.message)
    } finally {
      setLoadingPreview(false)
    }
  }

  return (
    <tr>
      <td>
        <strong>{track.title}</strong>
        <div className='text-muted small'>{track.composer}</div>
        <div className='mt-2'>
          {reviewUrl ? (
            <audio controls src={reviewUrl} className='w-100'>
              Your browser does not support audio playback.
            </audio>
          ) : (
            <Button
              size='sm'
              variant='outline-info'
              disabled={loadingPreview}
              onClick={loadReviewAudio}
            >
              {loadingPreview ? 'Loading audio...' : 'Listen'}
            </Button>
          )}
          {error && <Alert className='mt-2 mb-0 py-1' variant='danger'>{error}</Alert>}
        </div>
      </td>
      <td>
        {track.uploader?.name || 'Unknown'}
        <div className='text-muted small'>{track.uploader?.email}</div>
      </td>
      <td>
        <StatusBadge value={track.status} />{' '}
        <StatusBadge value={track.moderationStatus} />{' '}
        <StatusBadge value={track.processingStatus} />
      </td>
      <td>{formatDate(track.uploadedAt)}</td>
      <td className='text-end'>
        <Button
          className='me-2'
          size='sm'
          variant='success'
          onClick={() => onModerate({ trackId: track.id, decision: 'approve' })}
        >
          Approve
        </Button>
        <Button
          size='sm'
          variant='outline-danger'
          onClick={() => onModerate({ trackId: track.id, decision: 'reject' })}
        >
          Reject
        </Button>
      </td>
    </tr>
  )
}

export const getServerSideProps = async context => {
  const session = await getSession({ req: context.req })

  if (!session?.user?.email) {
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false
      }
    }
  }

  const currentUser = await prisma.user.findUnique({
    where: {
      email: session.user.email
    }
  })

  if (!canAccessSupportSurface(currentUser)) {
    return {
      props: {
        currentUser: currentUser ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role
        } : null,
        forbidden: true
      }
    }
  }

  const canManageUsers = canAccessAdminSurface(currentUser)
  const [
    userCount,
    trackCount,
    pendingTrackCount,
    orderCount,
    paymentEventCount,
    auditEventCount
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
    prisma.auditEvent.count()
  ])
  const tracks = await prisma.track.findMany({
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
  })
  const users = canManageUsers
    ? await prisma.user.findMany({
        orderBy: [
          {
            email: 'asc'
          }
        ],
        take: 100
      })
    : []
  const operations = await getAdminOperationsData()

  return {
    props: {
      currentUser: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role
      },
      canManageUsers,
      forbidden: false,
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
        uploadedAt: track.uploadedAt.toISOString()
      })),
      initialUsers: users.map(toUserAdminItem),
      initialOperations: JSON.parse(JSON.stringify(operations))
    }
  }
}

const AdminConsole = ({
  currentUser,
  canManageUsers = false,
  forbidden = false,
  initialSummary = null,
  initialTracks = [],
  initialUsers = [],
  initialOperations = null
}) => {
  const [summary, setSummary] = useState(initialSummary)
  const [tracks, setTracks] = useState(initialTracks)
  const [users, setUsers] = useState(initialUsers)
  const [operations, setOperations] = useState(initialOperations)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadAdminData = async () => {
    if (forbidden) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const [summaryData, trackData, userData, operationsData] = await Promise.all([
        fetchJson('/api/admin/summary'),
        fetchJson('/api/admin/tracks'),
        canManageUsers ? fetchJson('/api/admin/users') : Promise.resolve({ users: [] }),
        fetchJson('/api/admin/operations')
      ])

      setSummary(summaryData)
      setTracks(trackData.tracks)
      setUsers(userData.users)
      setOperations(operationsData)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  const moderateTrack = async ({ trackId, decision }) => {
    setNotice('')
    setError('')

    try {
      await fetchJson(`/api/admin/tracks/${trackId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ decision })
      })
      setTracks(tracks.filter(track => track.id !== trackId))
      setNotice(`Track ${decision}d.`)
      loadAdminData()
    } catch (moderationError) {
      setError(moderationError.message)
    }
  }

  const updateUser = updatedUser => {
    setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user))
    setNotice('User access updated.')
    loadAdminData()
  }

  if (forbidden) {
    return (
      <Container className='mt-5'>
        <Alert variant='danger'>
          Admin/support access is required for this area.
        </Alert>
      </Container>
    )
  }

  return (
    <Container className='mt-4 mb-5'>
      <Row className='align-items-center mb-3'>
        <Col>
          <h1 className='h3 mb-1'>Operations Console</h1>
          <div className='text-muted'>
            Signed in as {currentUser.email} · {currentUser.role}
          </div>
        </Col>
        <Col className='text-end'>
          <Button variant='outline-info' onClick={loadAdminData}>
            Refresh
          </Button>
        </Col>
      </Row>

      {error && <Alert variant='danger'>{error}</Alert>}
      {notice && <Alert variant='success'>{notice}</Alert>}

      {loading ? (
        <div className='py-5 text-center'>
          <Spinner animation='border' />
        </div>
      ) : (
        <Tabs defaultActiveKey='overview' className='mb-3'>
          <Tab eventKey='overview' title='Overview'>
            <Table bordered responsive size='sm'>
              <tbody>
                {Object.entries(summary || {}).map(([key, value]) => (
                  <tr key={key}>
                    <th className='text-capitalize'>{key.replace(/([A-Z])/g, ' $1')}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Tab>

          <Tab eventKey='tracks' title={`Track Review (${tracks.length})`}>
            <Table bordered hover responsive size='sm'>
              <thead>
                <tr>
                  <th>Track</th>
                  <th>Uploader</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th className='text-end'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map(track => (
                  <TrackReviewRow
                    key={track.id}
                    track={track}
                    onModerate={moderateTrack}
                  />
                ))}
                {tracks.length === 0 && (
                  <tr>
                    <td colSpan='5' className='text-center text-muted'>No pending tracks.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Tab>

          <Tab eventKey='operations' title='Operations'>
            <OperationsTables operations={operations} />
          </Tab>

          {canManageUsers && (
            <Tab eventKey='users' title='Users'>
              <Table bordered hover responsive size='sm'>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Account</th>
                    <th>Uploader</th>
                    <th className='text-end'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <UserAccessRow key={user.id} user={user} onSaved={updateUser} />
                  ))}
                </tbody>
              </Table>
            </Tab>
          )}
        </Tabs>
      )}
    </Container>
  )
}

export default AdminConsole
