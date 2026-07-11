import Link from 'next/link'
import BrandDisplayText from '../../components/brand/BrandDisplayText'
import { Button } from '../../components/ui/primitives'
import {
  listPublicWorksCollections,
  serializePublicWorksCollection
} from '../../lib/server/works-collections.mjs'
import {
  worksAndCollectionsTypeLabels
} from '../../lib/pricing-policy.mjs'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Works & Collections | Classical Music Catalogue'
}

const WorksCollectionsPage = async () => {
  const collections = (await listPublicWorksCollections()).map(serializePublicWorksCollection)

  return (
    <main className='cmc-works-page'>
      <div className='container'>
        <section className='cmc-works-board' aria-labelledby='works-heading'>
          <div className='cmc-works-board-rail' aria-hidden='true' />
          <header className='cmc-works-header'>
            <div>
              <p className='cmc-profile-kicker'>Works & Collections</p>
              <h1 id='works-heading'>
                <BrandDisplayText text='Grouped music for bigger practice plans.' />
              </h1>
              <p>
                Browse song cycles, learning sets and curated groups assembled from approved CMC tracks.
              </p>
            </div>
            <Button as={Link} href='/catalogue' variant='paper'>
              Browse Individual Tracks
            </Button>
          </header>

          {collections.length === 0 ? (
            <div className='cmc-works-empty'>
              <h2>No Works or Collections yet</h2>
              <p>Approved grouped catalogue items will appear here once uploaders publish them.</p>
            </div>
          ) : (
            <div className='cmc-works-list' aria-label='Works and Collections'>
              {collections.map(collection => (
                <article className='cmc-works-card' key={collection.id}>
                  <div>
                    <span className='cmc-works-card-type'>
                      {worksAndCollectionsTypeLabels[collection.catalogueType] || 'Collection'}
                    </span>
                    <h2>
                      <Link href={`/works-collections/${collection.id}`}>
                        {collection.title}
                      </Link>
                    </h2>
                    <p>{collection.composer || 'Mixed composers'}</p>
                  </div>
                  <dl>
                    <div>
                      <dt>Tracks</dt>
                      <dd>{collection.trackCount}</dd>
                    </div>
                    <div>
                      <dt>Uploader</dt>
                      <dd>{collection.uploaderName}</dd>
                    </div>
                    <div>
                      <dt>Price</dt>
                      <dd>{collection.formattedPrice}</dd>
                    </div>
                  </dl>
                  <Button as={Link} href={`/works-collections/${collection.id}`} variant='ink'>
                    View Collection
                  </Button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default WorksCollectionsPage
