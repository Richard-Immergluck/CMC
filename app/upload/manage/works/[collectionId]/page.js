import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import BrandDisplayText from '../../../../../components/brand/BrandDisplayText'
import { Button } from '../../../../../components/ui/primitives'
import { formatDisplayDate } from '../../../../../lib/date-format.mjs'
import {
  formatPricePence,
  worksAndCollectionsTypeLabels
} from '../../../../../lib/pricing-policy.mjs'
import { authOptions } from '../../../../../lib/server/auth'
import prisma from '../../../../../lib/server/prisma'
import {
  catalogueReleaseStatusDescriptions,
  catalogueReleaseStatusLabels,
  isPublicWorksCollectionStatus
} from '../../../../../lib/server/works-collections-core.mjs'
import {
  getUserWorksCollection,
  serializeWorksCollection
} from '../../../../../lib/server/works-collections.mjs'

export const dynamic = 'force-dynamic'

const pricingReviewLabels = {
  APPROVED: 'Approved',
  AUTO_APPROVED: 'Auto-approved',
  NEEDS_REVIEW: 'Needs pricing review',
  REJECTED: 'Pricing rejected'
}

const saleFormatLabels = {
  BUNDLE: 'Collection only',
  BOTH: 'Collection and individual tracks',
  INDIVIDUAL: 'Individual tracks'
}

const isBlockedCollectionTrack = track => {
  const hasLifecycleContext = track?.moderationStatus || track?.processingStatus || track?.status

  return Boolean(hasLifecycleContext) && (
    track.moderationStatus !== 'APPROVED' ||
    track.processingStatus !== 'READY' ||
    track.status !== 'PUBLISHED'
  )
}

const getBlockedCollectionTrackLabel = track => {
  if (track.moderationStatus === 'REJECTED' || track.status === 'REJECTED') {
    return 'Rejected'
  }

  if (track.processingStatus && track.processingStatus !== 'READY') {
    return track.processingStatus
  }

  return track.moderationStatus || track.status || 'Needs attention'
}

const getCollectionForSession = async ({ collectionId, email }) => {
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

  const collection = await getUserWorksCollection({
    collectionId,
    userId: user.id
  })

  return collection ? serializeWorksCollection(collection) : null
}

const WorksCollectionManagementDetailPage = async ({ params }) => {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/auth/signin?callbackUrl=/upload/manage')
  }

  const resolvedParams = await params
  const collectionIdParam = resolvedParams?.collectionId || ''
  const collectionId = Number.parseInt(collectionIdParam, 10)

  if (!/^\d+$/.test(collectionIdParam) || !Number.isInteger(collectionId)) {
    notFound()
  }

  const collection = await getCollectionForSession({
    collectionId,
    email: session.user.email
  })

  if (!collection) {
    notFound()
  }

  const blockedTracks = collection.tracks.filter(isBlockedCollectionTrack)

  return (
    <main className='cmc-profile-page cmc-works-management-detail-page'>
      <div className='container'>
        <section className='cmc-profile-board' aria-labelledby='works-management-detail-heading'>
          <header className='cmc-profile-header cmc-upload-management-header'>
            <div className='cmc-profile-staff' aria-hidden='true' />
            <div className='cmc-profile-paper' aria-hidden='true' />
            <div className='cmc-profile-heading'>
              <p className='cmc-profile-kicker'>
                {worksAndCollectionsTypeLabels[collection.catalogueType] || 'Work or Collection'}
              </p>
              <h1 id='works-management-detail-heading'>
                <BrandDisplayText text={`${collection.title}.`} />
              </h1>
              <p>{collection.composer || 'Mixed composers'}</p>
            </div>
            <aside className='cmc-profile-identity cmc-upload-management-summary' aria-label='Work or Collection summary'>
              <div>
                <h2>{collection.formattedPrice || formatPricePence(collection.pricePence)}</h2>
                <p>{catalogueReleaseStatusLabels[collection.status] || collection.status}</p>
              </div>
              <dl>
                <div>
                  <dt>Tracks</dt>
                  <dd>{collection.tracks.length}</dd>
                </div>
                <div>
                  <dt>Separate</dt>
                  <dd>{collection.formattedIndividualTracksTotal}</dd>
                </div>
                <div>
                  <dt>Sale</dt>
                  <dd>{saleFormatLabels[collection.saleFormat] || collection.saleFormat}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDisplayDate(collection.createdAt)}</dd>
                </div>
              </dl>
            </aside>
          </header>

          {catalogueReleaseStatusDescriptions[collection.status] && (
            <section className='cmc-profile-role-panel cmc-profile-role-panel--uploader' aria-label='Release lifecycle status'>
              <div>
                <p className='cmc-profile-kicker'>Release status</p>
                <h2>{catalogueReleaseStatusLabels[collection.status] || collection.status}</h2>
                <p>{catalogueReleaseStatusDescriptions[collection.status]}</p>
                <p>Pricing review: {pricingReviewLabels[collection.pricingReviewStatus] || collection.pricingReviewStatus}</p>
                <p>
                  Individual track total: {collection.formattedIndividualTracksTotal}
                  {collection.savingsPence > 0 ? ` · Buyer saving: ${collection.formattedSavings}` : ''}
                </p>
              </div>
            </section>
          )}

          {blockedTracks.length > 0 && (
            <section className='cmc-profile-role-panel cmc-profile-role-panel--uploader' aria-label='Blocked dependency recovery guidance'>
              <div>
                <p className='cmc-profile-kicker'>Blocked dependency</p>
                <h2>Repair this release before it can return to the catalogue</h2>
                <p>
                  One or more tracks in this Work or Collection are no longer approved and ready.
                  Edit the release from upload management, remove or replace the affected tracks,
                  then save it again to resubmit the repaired release for catalogue review.
                </p>
              </div>
              <ul className='cmc-upload-batch-track-list'>
                {blockedTracks.map(track => (
                  <li key={track.trackId}>
                    <span aria-hidden='true'>{String(track.position).padStart(2, '0')}</span>
                    <div>
                      <strong>{track.title}</strong>
                      <small>
                        {track.movementNo ? `${track.movementNo} · ` : ''}
                        {getBlockedCollectionTrackLabel(track)}
                      </small>
                    </div>
                    <dl>
                      <div>
                        <dt>Moderation</dt>
                        <dd>{track.moderationStatus || 'Unknown'}</dd>
                      </div>
                      <div>
                        <dt>Processing</dt>
                        <dd>{track.processingStatus || 'Unknown'}</dd>
                      </div>
                      <div>
                        <dt>Catalogue</dt>
                        <dd>{track.status || 'Unknown'}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className='cmc-upload-batch-actions' aria-label='Work or Collection actions'>
            <Button as={Link} href='/upload/manage' variant='paper'>
              Back to management
            </Button>
            {isPublicWorksCollectionStatus(collection.status) && (
              <Button as={Link} href={`/works-collections/${collection.id}`} variant='subtle'>
                Public page
              </Button>
            )}
          </section>

          <section className='cmc-upload-batch-tracks' aria-labelledby='works-management-tracks-heading'>
            <div className='cmc-profile-section-heading'>
              <div>
                <p className='cmc-profile-kicker'>Release contents</p>
                <h2 id='works-management-tracks-heading'>Included tracks</h2>
              </div>
              <p>{collection.tracks.length} tracks</p>
            </div>

            <ul className='cmc-upload-batch-track-list'>
              {collection.tracks.map(track => (
                <li key={track.trackId}>
                  <span aria-hidden='true'>{String(track.position).padStart(2, '0')}</span>
                  <div>
                    <Link href={`/catalogue/${track.trackId}`}>{track.title}</Link>
                    <small>
                      {track.movementNo ? `${track.movementNo} · ` : ''}
                      {track.composer || collection.composer || 'Unknown composer'}
                    </small>
                    {isBlockedCollectionTrack(track) && (
                      <small>Blocked dependency: {getBlockedCollectionTrackLabel(track)}</small>
                    )}
                  </div>
                  <dl>
                    <div>
                      <dt>Price</dt>
                      <dd>{track.formattedPrice || formatPricePence(track.pricePence || 0)}</dd>
                    </div>
                    <div>
                      <dt>Position</dt>
                      <dd>{track.position}</dd>
                    </div>
                    <div>
                      <dt>Section</dt>
                      <dd>{track.movementNo || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt>Composer</dt>
                      <dd>{track.composer || 'Mixed'}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </section>
        </section>
      </div>
    </main>
  )
}

export default WorksCollectionManagementDetailPage
