'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from 'react-use-cart'
import PlaySample from '../../PlaySample'
import { Button } from '../../ui/primitives'

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

const formatSeconds = seconds => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return null
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

const formatDuration = seconds => formatSeconds(seconds) || 'TBC'

const formatPreviewRange = track => {
  const previewStart = Number.isFinite(track.previewStart) ? track.previewStart : 0
  const previewEnd = Number.isFinite(track.previewEnd) && track.previewEnd > previewStart
    ? track.previewEnd
    : null

  if (!previewEnd) {
    return `From ${formatSeconds(previewStart) || '0:00'}`
  }

  return `${formatSeconds(previewStart) || '0:00'}-${formatSeconds(previewEnd) || 'TBC'}`
}

const CatalogueTrackDetailContent = ({ catalogueContext, track, comments }) => {
  const [activePreviewTrackId, setActivePreviewTrackId] = useState(null)
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

  const addToCart = () => {
    addItem({ ...track })
    setShowCartConfirmation(true)
  }

  const keyFacts = [
    ['Key', track.key],
    ['Instrumentation', track.instrumentation],
    ['Uploaded by', track.uploaderName],
    ['Uploaded', track.uploadedAt],
    ['Duration', formatDuration(track.durationSeconds)],
    ['Preview', formatPreviewRange(track)]
  ].filter(([, value]) => value)

  const commentCount = comments.length
  const noteText = track.additionalInfo || 'No additional information has been supplied for this track.'

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

        <section className='cmc-track-board' aria-labelledby='track-detail-heading'>
          <div className='cmc-track-board-rail' aria-hidden='true' />
          <div className='cmc-track-board-staff' aria-hidden='true' />

          <header className='cmc-track-board-header'>
            <div className='cmc-track-title-block'>
              <p className='cmc-kicker'>Catalogue detail</p>
              <h1 id='track-detail-heading'>{track.title}</h1>
              <p className='cmc-track-composer'>by {track.composer || 'Unknown composer'}</p>
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
          </header>

          <nav className='cmc-track-tabs' aria-label='Track detail sections'>
            <a href='#track-preview'>Preview</a>
            <a href='#track-details'>Details</a>
            <a href='#track-notes'>Notes</a>
            <a href='#track-comments'>Comments ({commentCount})</a>
          </nav>

          <div className='cmc-track-board-content'>
            <section className='cmc-track-preview-panel' id='track-preview' aria-label='Preview'>
              <div className='cmc-track-preview-copy'>
                <span>Preview</span>
                <strong>{formatPreviewRange(track)}</strong>
                <p>Listen to the approved sample chosen by the uploader.</p>
              </div>
              <div className='cmc-track-preview-player'>
                <PlaySample
                  active={activePreviewTrackId === track.id}
                  onActivate={() => setActivePreviewTrackId(track.id)}
                  onDeactivate={() => setActivePreviewTrackId(null)}
                  track={track}
                />
                <div className='cmc-track-waveform-strip' aria-hidden='true'>
                  {Array.from({ length: 54 }).map((_, index) => (
                    <span key={index} style={{ '--cmc-wave-bar': `${26 + ((index * 17) % 48)}%` }} />
                  ))}
                </div>
              </div>
            </section>

            <section className='cmc-track-facts-panel' id='track-details' aria-label='Track details'>
              <dl className='cmc-track-facts-grid'>
                {keyFacts.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className='cmc-track-notes-panel' id='track-notes' aria-label='Additional information'>
              <span>Notes</span>
              <p>{noteText}</p>
            </section>
          </div>
        </section>

        <section className='cmc-track-comments-section' id='track-comments'>
          <article className='cmc-track-comments-card'>
            <div className='cmc-track-section-header'>
              <h2>Comments</h2>
              <p>Purchasers can leave notes and performance feedback below the main track sheet.</p>
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
