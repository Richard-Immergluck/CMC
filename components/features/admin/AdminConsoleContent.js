'use client'

import { useState } from 'react'
import {
  Alert,
  Badge,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Tab,
  Table,
  Tabs
} from 'react-bootstrap'
import { Button } from '../../ui/primitives'

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

const formatPricePence = (pricePence, currency = 'gbp') => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format((pricePence || 0) / 100)
}

const pastTenseDecision = decision => decision === 'approve' ? 'approved' : 'rejected'

const clearAccessReviewBadge = {
  label: 'clear',
  variant: 'success'
}

const pricingReviewBadge = pricingReviews => {
  const count = (pricingReviews?.tracks?.length || 0) +
    (pricingReviews?.requestProposals?.length || 0) +
    (pricingReviews?.releases?.length || 0)

  return {
    label: count > 0 ? `${count} pending` : 'clear',
    variant: count > 0 ? 'warning' : 'success'
  }
}

const TabTitleWithBadge = ({ label, badge }) => (
  <span>
    {label}{' '}
    <Badge bg={badge.variant}>{badge.label}</Badge>
  </span>
)

const formatMinutes = value => {
  if (value === null || value === undefined) {
    return 'n/a'
  }

  if (value < 60) {
    return `${value}m`
  }

  const hours = Math.floor(value / 60)
  const minutes = value % 60

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

const auditRetentionLabel = retentionStatus => {
  if (!retentionStatus) {
    return 'unknown'
  }

  return retentionStatus.status === 'review' ? 'review' : 'clear'
}

const SecurityDashboard = ({ dashboard }) => {
  if (!dashboard) {
    return <Alert variant='secondary'>Security dashboard data is not available.</Alert>
  }

  const auditCounts = dashboard.auditActionCounts || {}
  const reviewMetrics = dashboard.accessReviewMetrics || {}
  const accountLifecycleSummary = dashboard.accountLifecycleSummary
  const auditRetentionStatus = dashboard.auditRetentionStatus
  const accessReviewBadge = dashboard.accessReviewBadge || clearAccessReviewBadge
  const recentAuditEvents = dashboard.recentAuditEvents || []
  const severityVariant = dashboard.severity === 'high'
    ? 'danger'
    : dashboard.severity === 'medium'
      ? 'warning'
      : 'success'

  return (
    <>
      <Row className='align-items-center mb-3'>
        <Col>
          <h2 className='h5 mb-0'>Security Dashboard</h2>
        </Col>
        <Col className='text-end'>
          <Button
            as='a'
            className='me-2'
            href='/api/admin/security-report?format=json'
            size='sm'
            target='_blank'
            variant='secondary'
          >
            Export JSON
          </Button>
          <Button
            as='a'
            href='/api/admin/security-report?format=csv'
            size='sm'
            variant='secondary'
          >
            Export CSV
          </Button>
        </Col>
      </Row>

      <Row className='g-3 mb-3'>
        <Col md={6} xl>
          <Card className='h-100'>
            <Card.Body>
              <div className='text-muted small'>Security posture</div>
              <div className='h4 mb-0'><Badge bg={severityVariant}>{dashboard.severity}</Badge></div>
              <div className='text-muted small mt-2'>{dashboard.windowDays} day window</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} xl>
          <Card className='h-100'>
            <Card.Body>
              <div className='text-muted small'>Pending reviews</div>
              <div className='h4 mb-0'><Badge bg={accessReviewBadge.variant}>{accessReviewBadge.label}</Badge></div>
              <div className='text-muted small mt-2'>{reviewMetrics.overduePending || 0} overdue after {dashboard.overdueHours}h</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} xl>
          <Card className='h-100'>
            <Card.Body>
              <div className='text-muted small'>Average review</div>
              <div className='h4 mb-0'>{formatMinutes(reviewMetrics.averageReviewMinutes)}</div>
              <div className='text-muted small mt-2'>Max {formatMinutes(reviewMetrics.maxReviewMinutes)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} xl>
          <Card className='h-100'>
            <Card.Body>
              <div className='text-muted small'>Recurring targets</div>
              <div className='h4 mb-0'>{reviewMetrics.recurringTargetUserIds?.length || 0}</div>
              <div className='text-muted small mt-2'>Repeated privileged access changes</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} xl>
          <Card className='h-100'>
            <Card.Body>
              <div className='text-muted small'>Audit retention</div>
              <div className='h4 mb-0'>
                <Badge bg={auditRetentionStatus?.status === 'review' ? 'warning' : 'success'}>
                  {auditRetentionLabel(auditRetentionStatus)}
                </Badge>
              </div>
              <div className='text-muted small mt-2'>
                {auditRetentionStatus?.cleanupCandidateCount || 0} cleanup candidates
              </div>
              <div className='text-muted small'>
                Oldest {auditRetentionStatus?.oldestAuditEventAgeDays ?? 'n/a'} days,
                window {auditRetentionStatus?.retentionDays || 'n/a'} days
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className='mb-3'>
        <Card.Body>
          <Row className='align-items-center g-3'>
            <Col md={3}>
              <div className='text-muted small'>Account lifecycle</div>
              <div className='h4 mb-0'>
                <Badge bg={accountLifecycleSummary?.status === 'review' ? 'warning' : 'success'}>
                  {accountLifecycleSummary?.status || 'unknown'}
                </Badge>
              </div>
            </Col>
            <Col md={3}>
              <div className='text-muted small'>Inactive accounts</div>
              <div className='h4 mb-0'>{accountLifecycleSummary?.inactiveAccounts || 0}</div>
              <div className='text-muted small'>
                {accountLifecycleSummary?.accounts?.suspended || 0} suspended,
                {' '}
                {accountLifecycleSummary?.accounts?.closed || 0} closed
              </div>
            </Col>
            <Col md={3}>
              <div className='text-muted small'>Rejected activity</div>
              <div className='h4 mb-0'>{accountLifecycleSummary?.rejectionEvents || 0}</div>
              <div className='text-muted small'>
                {accountLifecycleSummary?.lifecycleEvents?.inactiveApiRejected || 0} API,
                {' '}
                {accountLifecycleSummary?.lifecycleEvents?.signInDenied || 0} sign-in
              </div>
            </Col>
            <Col md={3}>
              <div className='text-muted small'>Session exits</div>
              <div className='h4 mb-0'>{accountLifecycleSummary?.lifecycleEvents?.signOut || 0}</div>
              <div className='text-muted small'>
                {accountLifecycleSummary?.lifecycleEvents?.accessUpdated || 0} access updates
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <h2 className='h5 mt-2'>Security Signals</h2>
      <Table bordered hover responsive size='sm'>
        <thead>
          <tr>
            <th>Signal</th>
            <th>Events</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(auditCounts).map(([action, count]) => (
            <tr key={action}>
              <td>{action}</td>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h2 className='h5 mt-4'>Recent Security Events</h2>
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
          {recentAuditEvents.map(auditEvent => (
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
          {recentAuditEvents.length === 0 && (
            <tr>
              <td colSpan='4' className='text-center text-muted'>No recent security events found.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  )
}

const UserAccessRow = ({ user, onSaved }) => {
  const [form, setForm] = useState({
    role: user.role,
    accountStatus: user.accountStatus,
    uploaderStatus: user.uploaderStatus,
    reason: ''
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
      onSaved(data)
      setForm({
        role: data.user.role,
        accountStatus: data.user.accountStatus,
        uploaderStatus: data.user.uploaderStatus,
        reason: ''
      })
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
        <Form.Control
          as='textarea'
          className='mt-2'
          name='reason'
          onChange={updateField}
          placeholder='Reason for privileged access changes'
          rows={2}
          size='sm'
          value={form.reason}
        />
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
        <Button size='sm' disabled={saving} onClick={save}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </td>
    </tr>
  )
}

const OperationsTables = ({
  activeAuditCategory,
  onLoadAuditCategory,
  operations,
  onReviewAccessRequest,
  reviewingAccessRequestId
}) => {
  const orders = operations?.orders || []
  const paymentEvents = operations?.paymentEvents || []
  const auditEvents = operations?.auditEvents || []
  const accessChangeRequests = operations?.accessChangeRequests || []
  const accessReviewBadge = operations?.securityDashboard?.accessReviewBadge || clearAccessReviewBadge

  return (
    <>
      <h2 className='h5 mt-2'>
        Access Change Reviews <Badge bg={accessReviewBadge.variant}>{accessReviewBadge.label}</Badge>
      </h2>
      <Table bordered hover responsive size='sm'>
        <thead>
          <tr>
            <th>Request</th>
            <th>Target User</th>
            <th>Requested By</th>
            <th>Requested Access</th>
            <th>Status</th>
            <th>Created</th>
            <th className='text-end'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {accessChangeRequests.map(request => (
            <tr key={request.id}>
              <td>#{request.id}</td>
              <td>
                {request.targetUser?.name || 'Unknown'}
                <div className='text-muted small'>{request.targetUser?.email}</div>
              </td>
              <td>
                {request.requestedBy?.name || 'Unknown'}
                <div className='text-muted small'>{request.requestedBy?.email}</div>
              </td>
              <td>
                {request.requestedRole && <div>Role: {request.requestedRole}</div>}
                {request.requestedAccountStatus && <div>Account: {request.requestedAccountStatus}</div>}
                {request.requestedUploaderStatus && <div>Uploader: {request.requestedUploaderStatus}</div>}
                {request.reasonProvided && <div className='text-muted small'>Reason provided</div>}
              </td>
              <td><StatusBadge value={request.status} /></td>
              <td>{formatDate(request.createdAt)}</td>
              <td className='text-end'>
                {request.status === 'PENDING' ? (
                  <>
                    <Button
                      className='me-2'
                      disabled={reviewingAccessRequestId === request.id}
                      onClick={() => onReviewAccessRequest({
                        requestId: request.id,
                        decision: 'approve'
                      })}
                      size='sm'
                    >
                      Approve
                    </Button>
                    <Button
                      disabled={reviewingAccessRequestId === request.id}
                      onClick={() => onReviewAccessRequest({
                        requestId: request.id,
                        decision: 'reject'
                      })}
                      size='sm'
                      variant='danger'
                    >
                      Reject
                    </Button>
                  </>
                ) : (
                  <span className='text-muted small'>Reviewed</span>
                )}
              </td>
            </tr>
          ))}
          {accessChangeRequests.length === 0 && (
            <tr>
              <td colSpan='7' className='text-center text-muted'>No access change requests found.</td>
            </tr>
          )}
        </tbody>
      </Table>

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
              <td>
                {order.items.length > 0 ? (
                  <ul className='list-unstyled mb-0'>
                    {order.items.map(item => (
                      <li key={item.id}>
                        {item.title}
                        {item.sourceReleaseTitle && (
                          <div className='text-muted small'>
                            Part of {item.sourceReleaseTitle}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : 'No items'}
              </td>
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

      <Row className='align-items-center mt-4 mb-2'>
        <Col>
          <h2 className='h5 mb-0'>Recent Audit Events</h2>
        </Col>
        <Col className='text-end'>
          <Button
            className='me-2'
            onClick={() => onLoadAuditCategory('')}
            size='sm'
            variant={activeAuditCategory ? 'subtle' : 'secondary'}
          >
            All audit
          </Button>
          <Button
            onClick={() => onLoadAuditCategory('accountLifecycle')}
            size='sm'
            variant={activeAuditCategory === 'accountLifecycle' ? 'secondary' : 'subtle'}
          >
            Account lifecycle
          </Button>
        </Col>
      </Row>
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
        {track.uploadBatch && (
          <div className='text-muted small mt-1'>
            Import batch: {track.uploadBatch.label || `Batch #${track.uploadBatch.id}`} · {track.uploadBatch.status} · {track.uploadBatch.trackCount} tracks
          </div>
        )}
        <div className='mt-2'>
          {reviewUrl ? (
            <audio controls src={reviewUrl} className='w-100'>
              Your browser does not support audio playback.
            </audio>
          ) : (
            <Button
              size='sm'
              variant='secondary'
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
          onClick={() => onModerate({ trackId: track.id, decision: 'approve' })}
        >
          Approve
        </Button>
        <Button
          size='sm'
          variant='danger'
          onClick={() => onModerate({ trackId: track.id, decision: 'reject' })}
        >
          Reject
        </Button>
      </td>
    </tr>
  )
}

const PricingReviewsTable = ({
  canReviewPricing,
  onReviewPricing,
  pricingReviews,
  reviewingPricingTarget
}) => {
  const tracks = pricingReviews?.tracks || []
  const releases = pricingReviews?.releases || []
  const proposals = pricingReviews?.requestProposals || []
  const hasReviews = tracks.length > 0 || releases.length > 0 || proposals.length > 0

  return (
    <div className='d-grid gap-4'>
      <Card>
        <Card.Body>
          <Card.Title>Track Price Reviews</Card.Title>
          <Table bordered hover responsive size='sm'>
            <thead>
              <tr>
                <th>Track</th>
                <th>Uploader</th>
                <th>Price</th>
                <th>Band</th>
                <th>Justification</th>
                <th className='text-end'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map(track => {
                const targetKey = `track-${track.id}`

                return (
                  <tr key={targetKey}>
                    <td>
                      <strong>{track.title}</strong>
                      <div className='text-muted small'>{track.composer}</div>
                    </td>
                    <td>
                      {track.uploader?.name || 'Unknown'}
                      <div className='text-muted small'>{track.uploader?.email}</div>
                    </td>
                    <td>{formatPricePence(track.pricePence, track.currency)}</td>
                    <td>{track.suggestedBand}</td>
                    <td>{track.pricingJustification || 'No note supplied.'}</td>
                    <td className='text-end'>
                      <Button
                        className='me-2'
                        disabled={!canReviewPricing || reviewingPricingTarget === targetKey}
                        onClick={() => onReviewPricing({
                          targetId: track.id,
                          targetType: 'track',
                          decision: 'approve'
                        })}
                        size='sm'
                      >
                        Approve
                      </Button>
                      <Button
                        disabled={!canReviewPricing || reviewingPricingTarget === targetKey}
                        onClick={() => onReviewPricing({
                          targetId: track.id,
                          targetType: 'track',
                          decision: 'reject'
                        })}
                        size='sm'
                        variant='danger'
                      >
                        Reject
                      </Button>
                    </td>
                  </tr>
                )
              })}
              {tracks.length === 0 && (
                <tr>
                  <td colSpan='6' className='text-center text-muted'>No track prices need review.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title>Works & Collections Price Reviews</Card.Title>
          <Table bordered hover responsive size='sm'>
            <thead>
              <tr>
                <th>Release</th>
                <th>Uploader</th>
                <th>Price</th>
                <th>Band</th>
                <th>Justification</th>
                <th className='text-end'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {releases.map(release => {
                const targetKey = `release-${release.id}`

                return (
                  <tr key={targetKey}>
                    <td>
                      <strong>{release.title}</strong>
                      <div className='text-muted small'>
                        {release.composer || 'Mixed composers'} · {release.trackCount} tracks
                      </div>
                      {release.tracks?.length > 0 && (
                        <ol className='cmc-admin-release-track-list'>
                          {release.tracks.slice(0, 4).map(track => (
                            <li key={`${release.id}-${track.trackId}`}>
                              {track.position}. {track.movementNo ? `${track.movementNo} · ` : ''}{track.title}
                            </li>
                          ))}
                          {release.tracks.length > 4 && (
                            <li>{release.tracks.length - 4} more tracks</li>
                          )}
                        </ol>
                      )}
                    </td>
                    <td>
                      {release.uploader?.name || 'Unknown'}
                      <div className='text-muted small'>{release.uploader?.email}</div>
                    </td>
                    <td>{formatPricePence(release.pricePence, release.currency)}</td>
                    <td>{release.suggestedBand}</td>
                    <td>{release.pricingJustification || 'No note supplied.'}</td>
                    <td className='text-end'>
                      <Button
                        className='me-2'
                        disabled={!canReviewPricing || reviewingPricingTarget === targetKey}
                        onClick={() => onReviewPricing({
                          targetId: release.id,
                          targetType: 'release',
                          decision: 'approve'
                        })}
                        size='sm'
                      >
                        Approve
                      </Button>
                      <Button
                        disabled={!canReviewPricing || reviewingPricingTarget === targetKey}
                        onClick={() => onReviewPricing({
                          targetId: release.id,
                          targetType: 'release',
                          decision: 'reject'
                        })}
                        size='sm'
                        variant='danger'
                      >
                        Reject
                      </Button>
                    </td>
                  </tr>
                )
              })}
              {releases.length === 0 && (
                <tr>
                  <td colSpan='6' className='text-center text-muted'>No Works or Collections prices need review.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title>Request Price Reviews</Card.Title>
          <Table bordered hover responsive size='sm'>
            <thead>
              <tr>
                <th>Request</th>
                <th>Track</th>
                <th>Proposed By</th>
                <th>Price</th>
                <th>Justification</th>
                <th className='text-end'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map(proposal => {
                const targetKey = `requestProposal-${proposal.id}`

                return (
                  <tr key={targetKey}>
                    <td>
                      <strong>{proposal.request?.title || `Request #${proposal.requestId}`}</strong>
                      <div className='text-muted small'>Requester: {proposal.request?.requestedBy?.email || 'Unknown'}</div>
                    </td>
                    <td>
                      {proposal.request?.track?.title || 'Unknown track'}
                      <div className='text-muted small'>{proposal.request?.track?.composer}</div>
                    </td>
                    <td>
                      {proposal.proposedBy?.name || 'Unknown'}
                      <div className='text-muted small'>{proposal.proposedBy?.email}</div>
                    </td>
                    <td>
                      {formatPricePence(proposal.pricePence, proposal.currency)}
                      <div className='text-muted small'>{proposal.suggestedBand}</div>
                    </td>
                    <td>{proposal.justification || 'No note supplied.'}</td>
                    <td className='text-end'>
                      <Button
                        className='me-2'
                        disabled={!canReviewPricing || reviewingPricingTarget === targetKey}
                        onClick={() => onReviewPricing({
                          targetId: proposal.id,
                          targetType: 'requestProposal',
                          decision: 'approve'
                        })}
                        size='sm'
                      >
                        Approve
                      </Button>
                      <Button
                        disabled={!canReviewPricing || reviewingPricingTarget === targetKey}
                        onClick={() => onReviewPricing({
                          targetId: proposal.id,
                          targetType: 'requestProposal',
                          decision: 'reject'
                        })}
                        size='sm'
                        variant='danger'
                      >
                        Reject
                      </Button>
                    </td>
                  </tr>
                )
              })}
              {proposals.length === 0 && (
                <tr>
                  <td colSpan='6' className='text-center text-muted'>No request prices need review.</td>
                </tr>
              )}
            </tbody>
          </Table>
          {!canReviewPricing && hasReviews && (
            <Alert className='mb-0' variant='warning'>
              Admin access is required to approve or reject pricing reviews.
            </Alert>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}

const AdminConsoleContent = ({
  currentUser,
  canManageUsers = false,
  forbidden = false,
  initialSummary = null,
  initialTracks = [],
  initialUsers = [],
  initialOperations = null,
  initialPricingReviews = null
}) => {
  const [summary, setSummary] = useState(initialSummary)
  const [tracks, setTracks] = useState(initialTracks)
  const [users, setUsers] = useState(initialUsers)
  const [operations, setOperations] = useState(initialOperations)
  const [pricingReviews, setPricingReviews] = useState(initialPricingReviews)
  const [operationsAuditCategory, setOperationsAuditCategory] = useState('')
  const [activeAdminTab, setActiveAdminTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [reviewingAccessRequestId, setReviewingAccessRequestId] = useState(null)
  const [reviewingPricingTarget, setReviewingPricingTarget] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const accessReviewBadge = operations?.securityDashboard?.accessReviewBadge || clearAccessReviewBadge
  const pendingPricingBadge = pricingReviewBadge(pricingReviews)
  const overdueReviews = operations?.securityDashboard?.accessReviewMetrics?.overduePending || 0

  const loadAdminData = async ({ auditCategory = operationsAuditCategory } = {}) => {
    if (forbidden) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const operationsQuery = auditCategory
        ? `?${new URLSearchParams({ auditCategory }).toString()}`
        : ''
      const [summaryData, trackData, userData, operationsData, pricingReviewData] = await Promise.all([
        fetchJson('/api/admin/summary'),
        fetchJson('/api/admin/tracks'),
        canManageUsers ? fetchJson('/api/admin/users') : Promise.resolve({ users: [] }),
        fetchJson(`/api/admin/operations${operationsQuery}`),
        fetchJson('/api/admin/pricing-reviews')
      ])

      setSummary(summaryData)
      setTracks(trackData.tracks)
      setUsers(userData.users)
      setOperations(operationsData)
      setPricingReviews(pricingReviewData)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  const loadAuditCategory = auditCategory => {
    setOperationsAuditCategory(auditCategory)
    loadAdminData({ auditCategory })
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

  const updateUser = data => {
    setUsers(users.map(user => user.id === data.user.id ? data.user : user))
    setNotice(data.requiresReview
      ? `Access change request #${data.accessChangeRequest.id} created for second review.`
      : 'User access updated.')
    loadAdminData()
  }

  const reviewAccessRequest = async ({ requestId, decision }) => {
    setNotice('')
    setError('')
    setReviewingAccessRequestId(requestId)

    try {
      await fetchJson(`/api/admin/user-access-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ decision })
      })
      setNotice(`Access change request ${pastTenseDecision(decision)}.`)
      loadAdminData()
    } catch (reviewError) {
      setError(reviewError.message)
    } finally {
      setReviewingAccessRequestId(null)
    }
  }

  const reviewPricing = async ({ targetId, targetType, decision }) => {
    const targetKey = `${targetType}-${targetId}`

    setNotice('')
    setError('')
    setReviewingPricingTarget(targetKey)

    try {
      await fetchJson('/api/admin/pricing-reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision,
          targetId,
          targetType
        })
      })
      setNotice(`Pricing review ${pastTenseDecision(decision)}.`)
      loadAdminData()
    } catch (reviewError) {
      setError(reviewError.message)
    } finally {
      setReviewingPricingTarget(null)
    }
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
          <Button variant='secondary' onClick={loadAdminData}>
            Refresh
          </Button>
        </Col>
      </Row>

      {error && <Alert variant='danger'>{error}</Alert>}
      {notice && <Alert variant='success'>{notice}</Alert>}
      {overdueReviews > 0 && (
        <Alert variant='danger'>
          {overdueReviews} privileged access review{overdueReviews === 1 ? ' is' : 's are'} overdue.
        </Alert>
      )}

      {loading ? (
        <div className='py-5 text-center'>
          <Spinner animation='border' />
        </div>
      ) : (
        <Tabs
          activeKey={activeAdminTab}
          className='mb-3'
          onSelect={key => setActiveAdminTab(key || 'overview')}
        >
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

          <Tab
            eventKey='pricing'
            title={<TabTitleWithBadge label='Pricing' badge={pendingPricingBadge} />}
          >
            <PricingReviewsTable
              canReviewPricing={currentUser.role === 'ADMIN'}
              onReviewPricing={reviewPricing}
              pricingReviews={pricingReviews}
              reviewingPricingTarget={reviewingPricingTarget}
            />
          </Tab>

          <Tab
            eventKey='operations'
            title={<TabTitleWithBadge label='Operations' badge={accessReviewBadge} />}
          >
            <OperationsTables
              activeAuditCategory={operationsAuditCategory}
              onLoadAuditCategory={loadAuditCategory}
              operations={operations}
              onReviewAccessRequest={reviewAccessRequest}
              reviewingAccessRequestId={reviewingAccessRequestId}
            />
          </Tab>

          <Tab
            eventKey='security'
            title={<TabTitleWithBadge label='Security' badge={accessReviewBadge} />}
          >
            <SecurityDashboard dashboard={operations?.securityDashboard} />
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

export default AdminConsoleContent
