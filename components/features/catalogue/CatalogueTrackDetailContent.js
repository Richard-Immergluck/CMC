'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useCart } from 'react-use-cart'
import { Button } from 'react-bootstrap'

const WaveFormRegion = dynamic(
  () => import('../../WaveFormRegion'),
  { ssr: false }
)

const createTrackProfileHref = track => `/profile/${track.id}-${track.userId}`

const CatalogueTrackDetailContent = ({ catalogueContext, track, comments }) => {
  const [url, setUrl] = useState('')
  const { addItem } = useCart()

  useEffect(() => {
    const fetchUrl = async () => {
      const response = await fetch(`/api/tracks/${track.id}/signed-url?mode=sample`)
      const data = await response.json()

      if (response.ok) {
        setUrl(data.url)
      }
    }

    fetchUrl()
  }, [track.id])

  const addToCart = () => {
    addItem({ ...track })
    alert('Track added to cart!')
  }

  const metadata = [
    ['Key', track.key],
    ['Instrumentation', track.instrumentation],
    ['Uploaded by', track.uploaderName],
    ['Uploaded', track.uploadedAt]
  ].filter(([, value]) => value)

  return (
    <main className='cmc-track-page'>
      <div className='container'>
        <Button
          as={Link}
          href='/catalogue'
          variant='outline-secondary'
          size='sm'
          className='cmc-track-back-button'
        >
          Back
        </Button>

        <section className='cmc-track-hero'>
          <div>
            <p className='cmc-kicker'>Catalogue detail</p>
            <h1>{track.title}</h1>
            <p className='cmc-track-composer'>by {track.composer}</p>
          </div>

          <aside className='cmc-track-purchase-panel' aria-label='Purchase track'>
            <span>Price</span>
            <strong>{track.formattedPrice || 'Price unavailable'}</strong>
            {catalogueContext.isAuthenticated &&
              !track.viewerState?.isOwned &&
              !track.viewerState?.isUploadedByViewer &&
              !catalogueContext.showOperationsOverlay && (
              <Button variant='info' size='md' onClick={addToCart}>
                Add to Cart
              </Button>
            )}
            {track.viewerState?.isOwned && (
              <Button as={Link} href={createTrackProfileHref(track)} variant='info' size='md'>
                View in Library
              </Button>
            )}
            {track.viewerState?.isUploadedByViewer && (
              <p>
                This is one of your uploaded catalogue tracks.
              </p>
            )}
            {catalogueContext.showOperationsOverlay && !track.viewerState?.isUploadedByViewer && (
              <Button as={Link} href='/admin' variant='outline-info' size='md'>
                Operations Console
              </Button>
            )}
            {!catalogueContext.isAuthenticated && (
              <p>
                Please <Link href='/auth/signin?callbackUrl=/catalogue'>login</Link> to add this track to your cart.
              </p>
            )}
          </aside>
        </section>

        <section className='cmc-track-layout'>
          <article className='cmc-track-main-panel'>
            <div className='cmc-track-section-header'>
              <h2>Preview</h2>
              <p>Listen to the approved sample before adding this track to your cart.</p>
            </div>
            <div className='cmc-track-waveform'>
              {url ? (
                <WaveFormRegion url={url} track={track} />
              ) : (
                <p>Preparing preview...</p>
              )}
            </div>
          </article>

          <aside className='cmc-track-meta-panel'>
            <h2>Track Details</h2>
            <dl className='cmc-track-meta-list'>
              {metadata.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </section>

        <section className='cmc-track-info-grid'>
          <article className='cmc-track-main-panel'>
            <div className='cmc-track-section-header'>
              <h2>Additional Information</h2>
            </div>
            <p className='cmc-track-notes'>
              {track.additionalInfo || 'No additional information has been supplied for this track.'}
            </p>
          </article>

          <article className='cmc-track-main-panel'>
            <div className='cmc-track-section-header'>
              <h2>Comments</h2>
              <p>Purchasers can leave notes and performance feedback here.</p>
            </div>
            <div className='cmc-track-comments'>
              {comments.map((comment, key) => (
                <div className='cmc-track-comment' key={comment.id}>
                  <span>{key + 1}</span>
                  <p>{comment.content}</p>
                  <small>by {comment.userName}</small>
                </div>
              ))}
              {comments.length === 0 && (
                <p className='cmc-track-empty'>
                  No comments yet. After purchasing this track you will be able to leave comments about it.
                </p>
              )}
            </div>
          </article>
        </section>

        <Link href='/catalogue' className='cmc-track-catalogue-link'>
          Back to the Catalogue
        </Link>
      </div>
    </main>
  )
}

export default CatalogueTrackDetailContent
