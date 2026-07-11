import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import BrandDisplayText from '../../../../components/brand/BrandDisplayText'
import { Button } from '../../../../components/ui/primitives'
import { authOptions } from '../../../../lib/server/auth'
import prisma from '../../../../lib/server/prisma'
import { serializeUploadBatch } from '../../../../lib/server/upload-batches.mjs'

export const dynamic = 'force-dynamic'

const batchStatusLabels = {
  DRAFT: 'Draft',
  UPLOADING: 'Uploading',
  READY_FOR_REVIEW: 'Ready for review',
  SUBMITTED: 'Submitted',
  PARTIALLY_FAILED: 'Needs attention',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived'
}

const resumableBatchStatuses = new Set([
  'DRAFT',
  'UPLOADING',
  'READY_FOR_REVIEW',
  'PARTIALLY_FAILED'
])

const formatBatchDate = value => {
  if (!value) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value))
}

const getBatchForUser = async ({ batchId, email }) => {
  const user = await prisma.user.findUnique({
    where: {
      email
    },
    select: {
      id: true
    }
  })

  if (!user) {
    return null
  }

  const batch = await prisma.uploadBatch.findFirst({
    where: {
      id: batchId,
      userId: user.id
    },
    include: {
      tracks: {
        orderBy: {
          uploadedAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          composer: true,
          moderationStatus: true,
          processingStatus: true,
          status: true,
          uploadedAt: true
        }
      }
    }
  })

  return batch ? serializeUploadBatch(batch) : null
}

const UploadBatchDetailPage = async ({ params }) => {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/auth/signin?callbackUrl=/upload/manage')
  }

  const resolvedParams = await params
  const batchIdParam = resolvedParams?.batchId || ''
  const batchId = Number.parseInt(batchIdParam, 10)

  if (!/^\d+$/.test(batchIdParam) || !Number.isInteger(batchId)) {
    notFound()
  }

  const batch = await getBatchForUser({
    batchId,
    email: session.user.email
  })

  if (!batch) {
    notFound()
  }

  const capacityUsedPercent = Math.min(100, Math.round((batch.summary.totalTracks / batch.capacity.maxTracks) * 100))

  return (
    <main className='cmc-profile-page cmc-upload-batch-detail-page'>
      <div className='container'>
        <section className='cmc-profile-board' aria-labelledby='upload-batch-heading'>
          <header className='cmc-profile-header cmc-upload-management-header'>
            <div className='cmc-profile-staff' aria-hidden='true' />
            <div className='cmc-profile-paper' aria-hidden='true' />
            <div className='cmc-profile-heading'>
              <p className='cmc-profile-kicker'>Upload Batch</p>
              <h1 id='upload-batch-heading'>
                <BrandDisplayText text={`${batch.label || `Batch ${batch.id}`}.`} />
              </h1>
              <p>
                Review the tracks attached to this batch, continue uploading related material, or submit the batch once it is ready for review.
              </p>
            </div>
            <aside className='cmc-profile-identity cmc-upload-management-summary' aria-label='Upload batch summary'>
              <div>
                <h2>{batchStatusLabels[batch.status] || batch.status}</h2>
                <p>Created {formatBatchDate(batch.createdAt)}</p>
              </div>
              <dl>
                <div>
                  <dt>Tracks</dt>
                  <dd>{batch.summary.totalTracks}</dd>
                </div>
                <div>
                  <dt>Ready</dt>
                  <dd>{batch.summary.readyTracks}</dd>
                </div>
                <div>
                  <dt>Review</dt>
                  <dd>{batch.summary.pendingReviewTracks}</dd>
                </div>
                <div>
                  <dt>Remaining</dt>
                  <dd>{batch.capacity.remainingTracks}</dd>
                </div>
              </dl>
            </aside>
          </header>

          <section className='cmc-upload-batch-actions' aria-label='Upload batch actions'>
            <Button as={Link} href='/upload/manage' variant='paper'>
              Back to management
            </Button>
            {resumableBatchStatuses.has(batch.status) && batch.capacity.canAddTracks && (
              <Button as={Link} href={`/upload?batchId=${batch.id}`} variant='ink'>
                Continue batch
              </Button>
            )}
            {resumableBatchStatuses.has(batch.status) && !batch.capacity.canAddTracks && (
              <Button disabled type='button' variant='ink'>
                Batch full
              </Button>
            )}
          </section>

          <section className='cmc-upload-batch-capacity-panel' aria-labelledby='upload-batch-capacity-heading'>
            <div>
              <p className='cmc-profile-kicker'>Batch capacity</p>
              <h2 id='upload-batch-capacity-heading'>{batch.summary.totalTracks}/{batch.capacity.maxTracks} tracks used</h2>
              <p>{batch.capacity.remainingTracks} upload slots remaining in this batch.</p>
            </div>
            <div className='cmc-upload-management-batch-capacity' aria-label={`${batch.summary.totalTracks} of ${batch.capacity.maxTracks} upload batch slots used`}>
              <span>{batch.summary.totalTracks}/{batch.capacity.maxTracks} tracks</span>
              <span>{batch.capacity.remainingTracks} slots remaining</span>
              <div aria-hidden='true'>
                <span style={{ width: `${capacityUsedPercent}%` }} />
              </div>
            </div>
          </section>

          <section className='cmc-upload-batch-defaults' aria-labelledby='upload-batch-defaults-heading'>
            <div className='cmc-profile-section-heading'>
              <div>
                <p className='cmc-profile-kicker'>Batch defaults</p>
                <h2 id='upload-batch-defaults-heading'>Shared upload context</h2>
              </div>
            </div>
            <dl>
              <div>
                <dt>Composer</dt>
                <dd>{batch.defaultComposer || 'Not set'}</dd>
              </div>
              <div>
                <dt>Instrumentation</dt>
                <dd>{batch.defaultInstrumentation || 'Not set'}</dd>
              </div>
              <div>
                <dt>Default price</dt>
                <dd>{batch.defaultPricePence ? `£${(batch.defaultPricePence / 100).toFixed(2)}` : 'Not set'}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{formatBatchDate(batch.submittedAt)}</dd>
              </div>
            </dl>
          </section>

          <section className='cmc-upload-batch-tracks' aria-labelledby='upload-batch-tracks-heading'>
            <div className='cmc-profile-section-heading'>
              <div>
                <p className='cmc-profile-kicker'>Tracks</p>
                <h2 id='upload-batch-tracks-heading'>Attached uploads</h2>
              </div>
              <p>{batch.tracks.length} tracks</p>
            </div>

            {batch.tracks.length === 0 ? (
              <div className='cmc-upload-management-empty'>
                <h3>No tracks attached yet</h3>
                <p>Continue this batch to add the first uploaded track.</p>
              </div>
            ) : (
              <ul className='cmc-upload-batch-track-list'>
                {batch.tracks.map((track, index) => (
                  <li key={track.id}>
                    <span aria-hidden='true'>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <Link href={`/catalogue/${track.id}`}>{track.title}</Link>
                      <small>{track.composer || 'Unknown composer'}</small>
                    </div>
                    <dl>
                      <div>
                        <dt>Processing</dt>
                        <dd>{track.processingStatus}</dd>
                      </div>
                      <div>
                        <dt>Review</dt>
                        <dd>{track.moderationStatus}</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>{track.status}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}

export default UploadBatchDetailPage
