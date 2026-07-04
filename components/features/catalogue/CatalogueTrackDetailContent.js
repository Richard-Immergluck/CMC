'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useCart } from 'react-use-cart'
import { Button } from '../../ui/primitives'

const WaveFormRegion = dynamic(
  () => import('../../WaveFormRegion'),
  { ssr: false }
)

const createTrackProfileHref = track => `/profile/${track.id}-${track.userId}`
const catalogueReturnTrackIdStorageKey = 'cmc.catalogue.returnTrackId'
const catalogueReturnUrlStorageKey = 'cmc.catalogue.returnUrl'

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  currency: 'GBP',
  style: 'currency'
})

const formatTrackPrice = track => {
  if (Number.isInteger(track.pricePence)) {
    return currencyFormatter.format(track.pricePence / 100)
  }

  if (typeof track.formattedPrice === 'string' && track.formattedPrice.startsWith('GBP ')) {
    return track.formattedPrice.replace(/^GBP\s+/, '£')
  }

  return track.formattedPrice || 'Price unavailable'
}

const CatalogueTrackDetailContent = ({ catalogueContext, track, comments }) => {
  const [url, setUrl] = useState('')
  const [showCartConfirmation, setShowCartConfirmation] = useState(false)
  const { addItem } = useCart()

  const getCatalogueReturnUrl = () => {
    const returnTrackId = sessionStorage.getItem(catalogueReturnTrackIdStorageKey)
    const returnUrl = sessionStorage.getItem(catalogueReturnUrlStorageKey)

    if (returnTrackId === String(track.id) && returnUrl?.startsWith('/catalogue')) {
      return returnUrl
    }

    return null
  }

  const goBackToCatalogue = () => {
    const returnUrl = getCatalogueReturnUrl()

    if (returnUrl && window.history.length > 1) {
      window.history.back()
      return
    }

    window.location.assign(returnUrl || '/catalogue')
  }

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
    setShowCartConfirmation(true)
  }

  const metadata = [
    ['Key', track.key],
    ['Instrumentation', track.instrumentation],
    ['Uploaded by', track.uploaderName],
    ['Uploaded', track.uploadedAt]
  ].filter(([, value]) => value)

  const renderBackButton = className => (
    <Button
      type='button'
      variant='paper'
      size='sm'
      className={['cmc-track-back-button', className].filter(Boolean).join(' ')}
      onClick={goBackToCatalogue}
    >
      <span className='cmc-button-icon' aria-hidden='true'>←</span>
      Back to Catalogue
    </Button>
  )

  return (
    <main className='cmc-track-page'>
      <div className='container'>
        {renderBackButton()}

        <section className='cmc-track-hero'>
          <div>
            <p className='cmc-kicker'>Catalogue detail</p>
            <h1>{track.title}</h1>
            <p className='cmc-track-composer'>by {track.composer}</p>
          </div>

          <aside className='cmc-track-purchase-panel' aria-label='Purchase track'>
            <span>Price</span>
            <strong>{formatTrackPrice(track)}</strong>
            {catalogueContext.isAuthenticated &&
              !track.viewerState?.isOwned &&
              !track.viewerState?.isUploadedByViewer &&
              !catalogueContext.showOperationsOverlay && (
              <Button variant='ink' size='md' onClick={addToCart}>
                Add to Cart
              </Button>
            )}
            {track.viewerState?.isOwned && (
              <Button as={Link} href={createTrackProfileHref(track)} variant='ink' size='md'>
                View in Library
              </Button>
            )}
            {track.viewerState?.isUploadedByViewer && (
              <p>
                This is one of your uploaded catalogue tracks.
              </p>
            )}
            {catalogueContext.showOperationsOverlay && !track.viewerState?.isUploadedByViewer && (
              <Button as={Link} href='/admin' variant='secondary' size='md'>
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

        {renderBackButton('cmc-track-back-button--footer')}
      </div>

      {showCartConfirmation && (
        <div
          aria-labelledby='cart-confirmation-title'
          aria-modal='true'
          className='cmc-modal-shell'
          role='dialog'
          tabIndex='-1'
        >
          <button
            aria-label='Close cart confirmation'
            className='cmc-modal-backdrop'
            onClick={() => setShowCartConfirmation(false)}
            type='button'
          />
          <section className='cmc-modal-card cmc-cart-confirmation'>
            <div className='cmc-modal-header'>
              <p className='cmc-kicker'>Cart updated</p>
              <button
                aria-label='Close cart confirmation'
                className='cmc-modal-close'
                onClick={() => setShowCartConfirmation(false)}
                type='button'
              >
                X
              </button>
            </div>

            <div className='cmc-modal-body'>
              <h2 id='cart-confirmation-title'>{track.title} has been added to your cart.</h2>
              <p>
                You can keep browsing the archive or review your cart when you are ready to complete checkout.
              </p>
            </div>

            <div className='cmc-modal-actions'>
              <Button variant='paper' onClick={() => setShowCartConfirmation(false)}>
                Continue Browsing
              </Button>
              <Button as={Link} href='/cart' variant='ink'>
                View Cart
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default CatalogueTrackDetailContent
