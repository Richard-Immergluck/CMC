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

const getInitials = name => {
  if (!name) {
    return 'CM'
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
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

  const commentCount = comments.length
  const downloadCount = track._count?.TrackOwner || 0
  const showBasketAction = catalogueContext.isAuthenticated &&
    !track.viewerState?.isOwned &&
    !track.viewerState?.isUploadedByViewer &&
    !catalogueContext.showOperationsOverlay
  const showOwnedAction = track.viewerState?.isOwned
  const showOperationsAction = catalogueContext.showOperationsOverlay && !track.viewerState?.isUploadedByViewer
  const showPurchaseDivider = showBasketAction || showOwnedAction || showOperationsAction
  const noteText = track.additionalInfo || 'No additional information has been supplied for this track.'
  const detailTiles = [
    {
      icon: '𝄞',
      label: 'Key',
      value: track.key || 'Unspecified'
    },
    {
      icon: '♬',
      label: 'Instrumentation',
      value: track.instrumentation || 'Unspecified'
    },
    {
      icon: '◷',
      label: 'Duration',
      value: formatDuration(track.durationSeconds)
    },
    {
      icon: '♙',
      label: 'Uploaded by',
      value: track.uploaderName || 'Unknown'
    },
    {
      icon: '□',
      label: 'Uploaded',
      value: track.uploadedAt || 'Unknown'
    },
    {
      icon: '↓',
      label: 'Downloads',
      value: String(downloadCount)
    },
    {
      icon: '○',
      label: 'Comments',
      value: String(commentCount)
    }
  ]

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

        <section className='cmc-track-board cmc-track-board--option-one' aria-labelledby='track-detail-heading'>
          <header className='cmc-track-board-header'>
            <div className='cmc-track-hero-staff' aria-hidden='true' />
            <div className='cmc-track-hero-paper' aria-hidden='true' />
            <div className='cmc-track-title-block'>
              <h1 id='track-detail-heading'>{track.title}</h1>
              <p className='cmc-track-composer'>{track.composer || 'Unknown composer'}</p>
              <p className='cmc-track-uploader-line'>
                <span>Uploaded by {track.uploaderName || 'Unknown'}</span>
                <span aria-hidden='true' />
                <time>{track.uploadedAt || 'Unknown date'}</time>
              </p>
            </div>

            <aside className='cmc-track-purchase-panel' aria-label='Purchase track'>
              <strong>{formatTrackPrice(track)}</strong>
              {showBasketAction && (
                <Button variant='ink' size='md' onClick={addToCart}>
                  Add to Basket
                </Button>
              )}
              {showOwnedAction && (
                <Button as={Link} href={createTrackProfileHref(track)} variant='ink' size='md'>
                  View in Library
                </Button>
              )}
              {track.viewerState?.isUploadedByViewer && (
                <p>
                  This is one of your uploaded catalogue tracks.
                </p>
              )}
              {showOperationsAction && (
                <Button as={Link} href='/admin' variant='secondary' size='md'>
                  Operations Console
                </Button>
              )}
              {!catalogueContext.isAuthenticated && (
                <p>
                  Please <Link href='/auth/signin?callbackUrl=/catalogue'>login</Link> to add this track to your cart.
                </p>
              )}
              {showPurchaseDivider && <span className='cmc-track-purchase-divider' aria-hidden='true' />}
              <Button variant='paper' size='md' className='cmc-track-wishlist-button'>
                <span className='cmc-track-wishlist-icon' aria-hidden='true' />
                Add to Wishlist
              </Button>
            </aside>
          </header>

          <section className='cmc-track-preview-panel' id='track-preview' aria-label='Preview'>
            <PlaySample
              active={activePreviewTrackId === track.id}
              onActivate={() => setActivePreviewTrackId(track.id)}
              onDeactivate={() => setActivePreviewTrackId(null)}
              track={track}
            />
            <span className='cmc-track-preview-time'>0:00</span>
            <div className='cmc-track-preview-waveform'>
              <div className='cmc-track-waveform-strip' aria-hidden='true'>
                {Array.from({ length: 72 }).map((_, index) => (
                  <span key={index} style={{ '--cmc-wave-bar': `${24 + ((index * 17) % 54)}%` }} />
                ))}
              </div>
              <p>Preview: {formatPreviewRange(track)}</p>
            </div>
            <span className='cmc-track-preview-time'>{formatDuration(track.durationSeconds)}</span>
          </section>

          <section className='cmc-track-facts-panel' id='track-details' aria-label='Track details'>
            <dl className='cmc-track-facts-grid'>
              {detailTiles.map(tile => (
                <div key={tile.label}>
                  <dt>{tile.label}</dt>
                  <dd>
                    <span className='cmc-track-fact-icon' aria-hidden='true'>{tile.icon}</span>
                    <strong>{tile.value}</strong>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className='cmc-track-notes-panel' id='track-notes' aria-label='Additional information'>
            <span>Additional Notes</span>
            <p>{noteText}</p>
          </section>

          <section className='cmc-track-comments-section' id='track-comments'>
            <div className='cmc-track-section-header'>
              <h2>Comments <span>({commentCount})</span></h2>
              <small>Sort: Newest</small>
            </div>
            <div className='cmc-track-comments'>
              {comments.map((comment, key) => (
                <div className='cmc-track-comment' key={comment.id}>
                  <span className='cmc-track-comment-avatar'>{getInitials(comment.userName)}</span>
                  <div>
                    <header>
                      <strong>{comment.userName}</strong>
                      <time>{comment.createdAt}</time>
                    </header>
                    <p>{comment.content}</p>
                    <footer>
                      <button type='button'>Reply</button>
                      <span>·</span>
                      <button type='button'>Helpful</button>
                    </footer>
                  </div>
                  <button className='cmc-track-comment-menu' aria-label={`More actions for comment ${key + 1}`} type='button'>
                    ...
                  </button>
                </div>
              ))}
              {comments.length === 0 && (
                <p className='cmc-track-empty'>
                  No comments yet. After purchasing this track you will be able to leave comments about it.
                </p>
              )}
            </div>
            <div className='cmc-track-paper-edge' aria-hidden='true' />
          </section>
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
              <h2 id='cart-confirmation-title'>{track.title} has been added to your basket.</h2>
              <p>
                You can keep browsing the archive or review your basket when you are ready to complete checkout.
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
