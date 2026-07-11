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

const publicPricingReviewStatuses = new Set(['AUTO_APPROVED', 'APPROVED'])

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
                <p>{pricingReviewLabels[collection.pricingReviewStatus] || collection.pricingReviewStatus}</p>
              </div>
              <dl>
                <div>
                  <dt>Tracks</dt>
                  <dd>{collection.tracks.length}</dd>
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

          <section className='cmc-upload-batch-actions' aria-label='Work or Collection actions'>
            <Button as={Link} href='/upload/manage' variant='paper'>
              Back to management
            </Button>
            {publicPricingReviewStatuses.has(collection.pricingReviewStatus) && (
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
                  </div>
                  <dl>
                    <div>
                      <dt>Track ID</dt>
                      <dd>{track.trackId}</dd>
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
