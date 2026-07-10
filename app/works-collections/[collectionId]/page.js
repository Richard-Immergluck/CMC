import Link from 'next/link'
import { notFound } from 'next/navigation'
import BrandDisplayText from '../../../components/brand/BrandDisplayText'
import { Button } from '../../../components/ui/primitives'
import { formatDisplayDate } from '../../../lib/date-format.mjs'
import {
  getPublicWorksCollection,
  serializePublicWorksCollection
} from '../../../lib/server/works-collections.mjs'
import {
  worksAndCollectionsTypeLabels
} from '../../../lib/pricing-policy.mjs'
import {
  validateInput,
  worksCollectionIdParamSchema
} from '../../../lib/validation/api.mjs'

export const dynamic = 'force-dynamic'

const formatDuration = seconds => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 'TBC'
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = String(seconds % 60).padStart(2, '0')

  return `${minutes}:${remainingSeconds}`
}

export const generateMetadata = async ({ params }) => {
  const { collectionId } = validateInput(worksCollectionIdParamSchema, await params)
  const collection = await getPublicWorksCollection({
    collectionId
  })

  if (!collection) {
    return {
      title: 'Work or Collection not found | Classical Music Catalogue'
    }
  }

  return {
    title: `${collection.title} | Classical Music Catalogue`
  }
}

const WorksCollectionDetailPage = async ({ params }) => {
  const { collectionId } = validateInput(
    worksCollectionIdParamSchema,
    await params,
    'Invalid Work or Collection id'
  )
  const collectionRecord = await getPublicWorksCollection({
    collectionId
  })

  if (!collectionRecord) {
    notFound()
  }

  const collection = serializePublicWorksCollection(collectionRecord)

  return (
    <main className='cmc-works-page cmc-works-detail-page'>
      <div className='container'>
        <section className='cmc-works-board cmc-works-detail-board' aria-labelledby='works-detail-heading'>
          <div className='cmc-works-board-rail' aria-hidden='true' />
          <header className='cmc-works-detail-header'>
            <div>
              <p className='cmc-profile-kicker'>
                {worksAndCollectionsTypeLabels[collection.catalogueType] || 'Collection'}
              </p>
              <h1 id='works-detail-heading'>
                <BrandDisplayText text={`${collection.title}.`} />
              </h1>
              <p>{collection.composer || 'Mixed composers'}</p>
              <p className='cmc-works-detail-meta'>
                Curated by {collection.uploaderName} · Created {formatDisplayDate(collection.createdAt)}
              </p>
            </div>

            <aside className='cmc-works-purchase-panel' aria-label='Collection purchase'>
              <strong>{collection.formattedPrice}</strong>
              <p>{collection.trackCount} tracks in this Work or Collection</p>
              <Button as={Link} href='/cart' variant='ink'>
                Collection Checkout Coming Next
              </Button>
              <Button as={Link} href='/works-collections' variant='paper'>
                Back to Works
              </Button>
            </aside>
          </header>

          <section className='cmc-works-track-list' aria-labelledby='works-tracks-heading'>
            <div className='cmc-works-section-heading'>
              <h2 id='works-tracks-heading'>Included Tracks</h2>
              <p>Each item can still be opened as an individual catalogue track.</p>
            </div>
            <div className='cmc-works-track-table' role='table' aria-label={`Tracks in ${collection.title}`}>
              <div className='cmc-works-track-table-head' role='row'>
                <span aria-hidden='true' />
                <span role='columnheader'>Title</span>
                <span role='columnheader'>Key</span>
                <span role='columnheader'>Instrumentation</span>
                <span role='columnheader'>Duration</span>
                <span role='columnheader'>Price</span>
                <span aria-hidden='true' />
              </div>
              <ul>
                {collection.tracks.map(track => (
                  <li key={track.trackId} role='row'>
                    <span aria-hidden='true'>{String(track.position).padStart(2, '0')}</span>
                    <div role='cell'>
                      <Link href={`/catalogue/${track.trackId}`}>
                        {track.title}
                      </Link>
                      <small>{track.composer || collection.composer || 'Unknown composer'}</small>
                    </div>
                    <span role='cell'>{track.key || 'Not set'}</span>
                    <span role='cell'>{track.instrumentation || 'Not set'}</span>
                    <span role='cell'>{formatDuration(track.durationSeconds)}</span>
                    <span role='cell'>{track.formattedPrice}</span>
                    <Button as={Link} href={`/catalogue/${track.trackId}`} size='sm' variant='paper'>
                      Details
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}

export default WorksCollectionDetailPage
