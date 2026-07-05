'use client'

import { memo, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Download,
  Search,
  ShieldCheck,
  UploadCloud,
  X
} from 'lucide-react'
import { useCart } from 'react-use-cart'
import BrandDisplayText from '../../brand/BrandDisplayText'
import { Button } from '../../ui/primitives'
import {
  canAccessSupportSurface,
  canUploadTracks
} from '../../../lib/access-control.mjs'

const normalize = value => String(value || '').toLowerCase()

const getCatalogueTrackHref = track => `/catalogue/${track.id}`

const formatPlaybackTime = seconds => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }

  const roundedSeconds = Math.floor(seconds)
  const minutes = Math.floor(roundedSeconds / 60)
  const remainingSeconds = String(roundedSeconds % 60).padStart(2, '0')

  return `${minutes}:${remainingSeconds}`
}

const uniqueSortedValues = (tracks, key) => {
  const values = tracks
    .map(track => track[key])
    .filter(Boolean)

  return [...new Set(values)].sort((first, second) => first.localeCompare(second))
}

const getDisplayName = user => user.name || user.email || 'CMC member'

const getInitials = user => {
  const source = getDisplayName(user)
  const words = source.split(/[\s@._-]+/).filter(Boolean)

  if (words.length === 0) {
    return 'CM'
  }

  return words.slice(0, 2).map(word => word[0]).join('').toUpperCase()
}

const matchesSearch = (track, search) => {
  if (!search) {
    return true
  }

  const haystack = [
    track.title,
    track.composer,
    track.key,
    track.instrumentation,
    track.additionalInfo
  ].map(normalize).join(' ')

  return haystack.includes(normalize(search))
}

const ProfileInlinePlayer = ({ active, onActivate, onDeactivate, track }) => {
  const audioRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(Number.isFinite(track.durationSeconds) ? track.durationSeconds : 0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState('')

  useEffect(() => {
    const audio = audioRef.current

    if (!audio || !url) {
      return undefined
    }

    if (!active) {
      audio.pause()
      return undefined
    }

    audio.play().catch(() => {
      setError('Playback unavailable')
      onDeactivate()
    })

    return undefined
  }, [active, onDeactivate, url])

  useEffect(() => () => {
    audioRef.current?.pause()
  }, [])

  const fetchFullTrackUrl = async () => {
    if (url) {
      return url
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/tracks/${track.id}/signed-url?mode=full`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Playback unavailable')
      }

      setUrl(data.url)
      return data.url
    } catch (playbackError) {
      setError(playbackError.message || 'Playback unavailable')
      onDeactivate()
      return ''
    } finally {
      setLoading(false)
    }
  }

  const togglePlayback = async () => {
    if (active) {
      onDeactivate()
      return
    }

    onActivate()
    await fetchFullTrackUrl()
  }

  const handleLoadedMetadata = event => {
    const loadedDuration = event.currentTarget.duration

    if (Number.isFinite(loadedDuration)) {
      setDuration(loadedDuration)
    }
  }

  const handleTimeUpdate = event => {
    setCurrentTime(event.currentTarget.currentTime)
  }

  const handleSeek = event => {
    const nextTime = Number(event.target.value)
    setCurrentTime(nextTime)

    if (audioRef.current) {
      audioRef.current.currentTime = nextTime
    }
  }

  const safeDuration = Math.max(0, Number.isFinite(duration) ? duration : 0)
  const sliderMax = safeDuration || 1

  return (
    <div className='cmc-profile-inline-player'>
      <Button
        aria-label={active ? `Pause ${track.title}` : `Play ${track.title}`}
        aria-pressed={active}
        className={active ? 'cmc-profile-inline-play cmc-profile-inline-play--active' : 'cmc-profile-inline-play'}
        disabled={loading}
        onClick={togglePlayback}
        size='sm'
        type='button'
        variant='secondary'
      >
        {active ? (
          <span className='cmc-preview-pause-icon' aria-hidden='true'>
            <span />
            <span />
          </span>
        ) : (
          <span className='cmc-profile-play-triangle' aria-hidden='true' />
        )}
      </Button>
      <div className='cmc-profile-inline-timeline'>
        <input
          aria-label={`Playback position for ${track.title}`}
          disabled={!url && !active}
          max={sliderMax}
          min='0'
          onChange={handleSeek}
          step='0.1'
          type='range'
          value={Math.min(currentTime, sliderMax)}
        />
        <span>{formatPlaybackTime(currentTime)} / {formatPlaybackTime(safeDuration)}</span>
      </div>
      {error && <small role='alert'>{error}</small>}
      {url && (
        <audio
          ref={audioRef}
          className='cmc-audio-preview-source'
          onEnded={onDeactivate}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          preload='metadata'
          src={url}
        />
      )}
    </div>
  )
}

const TrackTable = ({
  emptyAction,
  emptyText,
  emptyTitle,
  tracks
}) => {
  const [activePreviewTrackId, setActivePreviewTrackId] = useState(null)

  if (tracks.length === 0) {
    return (
      <div className='cmc-profile-empty'>
        <Download aria-hidden='true' strokeWidth={1.7} />
        <h2>{emptyTitle}</h2>
        <p>{emptyText}</p>
        {emptyAction}
      </div>
    )
  }

  return (
    <div className='cmc-profile-table' role='table' aria-label='Downloaded tracks'>
      <div className='cmc-profile-table-head' role='row'>
        <span className='cmc-profile-column-index' aria-hidden='true' />
        <span role='columnheader'>Title</span>
        <span role='columnheader'>Composer</span>
        <span role='columnheader'>Key</span>
        <span className='cmc-profile-column-preview' aria-hidden='true' />
        <span className='cmc-profile-column-download' aria-hidden='true' />
      </div>
      <ul className='cmc-profile-table-body'>
        {tracks.map((track, index) => (
          <li className='cmc-profile-table-row' key={track.id} role='row'>
            <span className='cmc-profile-row-index' aria-hidden='true'>
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className='cmc-profile-track-title' role='cell'>
              <Link href={getCatalogueTrackHref(track)}>
                {track.title}
              </Link>
              <span>{track.uploadedAt ? `Added ${track.uploadedAt}` : 'Purchased track'}</span>
            </div>
            <span role='cell'>{track.composer || 'Unknown composer'}</span>
            <span role='cell'>{track.key || 'Not set'}</span>
            <div className='cmc-profile-preview-cell' role='cell'>
              <ProfileInlinePlayer
                active={activePreviewTrackId === track.id}
                onActivate={() => setActivePreviewTrackId(track.id)}
                onDeactivate={() => setActivePreviewTrackId(null)}
                track={track}
              />
            </div>
            <div className='cmc-profile-row-actions' role='cell'>
              <Button
                aria-label={`Download ${track.title}`}
                as='a'
                href={`/api/tracks/${track.id}/signed-url?mode=download&redirect=1`}
                rel='noreferrer'
                target='_blank'
                download={track.downloadName}
                size='sm'
                variant='ink'
              >
                <Download aria-hidden='true' strokeWidth={1.8} />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

const ProfilePageContent = ({
  checkout,
  checkoutSessionId,
  currentUser,
  purchase,
  userComments,
  userUploadedTracks,
  userTrackRequests,
  userPurchasedTracks
}) => {
  const [checkoutError, setCheckoutError] = useState('')
  const [composerFilter, setComposerFilter] = useState('all')
  const [keyFilter, setKeyFilter] = useState('all')
  const [search, setSearch] = useState('')
  const router = useRouter()
  const { emptyCart } = useCart()

  useEffect(() => {
    const reconcileCheckout = async () => {
      if (checkout !== 'success') {
        return
      }

      if (!checkoutSessionId) {
        emptyCart()
        setCheckoutError('Checkout returned without a session id, so the purchase could not be confirmed automatically.')
        return
      }

      try {
        const response = await fetch('/api/stripe/checkout_sessions/reconcile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: checkoutSessionId
          })
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Unable to confirm purchase')
        }

        if (data.status === 'fulfilled' || data.status === 'already_fulfilled') {
          emptyCart()
          router.replace('/profile?purchase=confirmed')
          router.refresh()
          return
        }

        setCheckoutError('Stripe has not marked this payment as complete yet. Please refresh shortly.')
      } catch (error) {
        setCheckoutError(error.message || 'Unable to confirm purchase')
      }
    }

    reconcileCheckout()
  }, [checkout, checkoutSessionId, emptyCart, router])

  const composerOptions = useMemo(() => uniqueSortedValues(userPurchasedTracks, 'composer'), [userPurchasedTracks])
  const keyOptions = useMemo(() => uniqueSortedValues(userPurchasedTracks, 'key'), [userPurchasedTracks])
  const filteredPurchasedTracks = useMemo(() => userPurchasedTracks.filter(track => {
    if (composerFilter !== 'all' && track.composer !== composerFilter) {
      return false
    }

    if (keyFilter !== 'all' && track.key !== keyFilter) {
      return false
    }

    return matchesSearch(track, search)
  }), [composerFilter, keyFilter, search, userPurchasedTracks])

  const purchaseConfirmed = purchase === 'confirmed'
  const displayName = getDisplayName(currentUser)
  const canUpload = canUploadTracks(currentUser)
  const canAccessOperations = canAccessSupportSurface(currentUser)
  const secondaryPanels = [
    {
      label: 'Wishlist',
      value: '0',
      text: 'Saved tracks will appear here once wishlist actions are fully wired.'
    },
    {
      label: 'My requests',
      value: userTrackRequests.length,
      text: userTrackRequests.length === 0
        ? 'Track requests and followed requests will live here.'
        : 'Recent requests you have created or followed.',
      items: userTrackRequests.slice(0, 3).map(request => ({
        href: request.trackId ? `/catalogue/${request.trackId}?tab=requests&requestId=${request.id}` : null,
        meta: `${request.status.toLowerCase().replace('_', ' ')} · ${request.createdAt}`,
        title: request.title.replace(/^E2E Request /, '')
      }))
    },
    {
      label: 'Recent comments',
      value: userComments.length,
      text: userComments.length === 0
        ? 'Your contribution history will appear here as community features expand.'
        : 'Recent comments you have added to downloaded tracks.',
      items: userComments.slice(0, 3).map(comment => ({
        href: `/catalogue/${comment.trackId}?tab=comments&commentId=${comment.id}`,
        meta: comment.createdAt,
        title: comment.trackTitle
      }))
    }
  ]

  return (
    <main className='cmc-profile-page'>
      <div className='container'>
        <section className='cmc-profile-board' aria-labelledby='profile-heading'>
          <header className='cmc-profile-header'>
            <div className='cmc-profile-staff' aria-hidden='true' />
            <div className='cmc-profile-paper' aria-hidden='true' />
            <div className='cmc-profile-heading'>
              <p className='cmc-profile-kicker'>Your music</p>
              <h1 id='profile-heading'>
                <BrandDisplayText text='My profile.' />
              </h1>
              <p>
                Search, download and manage the tracks you own. Uploader and operations tools appear here when your role allows them.
              </p>
            </div>
            <aside className='cmc-profile-identity' aria-label='Profile summary'>
              <div className='cmc-profile-avatar'>
                <span>{getInitials(currentUser)}</span>
              </div>
              <div>
                <h2>{displayName}</h2>
                <p>{currentUser.email}</p>
              </div>
              <dl>
                <div>
                  <dt>Downloads</dt>
                  <dd>{userPurchasedTracks.length}</dd>
                </div>
                <div>
                  <dt>Uploads</dt>
                  <dd>{userUploadedTracks.length}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{currentUser.role?.toLowerCase() || 'member'}</dd>
                </div>
              </dl>
            </aside>
          </header>

          {purchaseConfirmed && (
            <div className='cmc-profile-notice cmc-profile-notice--success' role='status'>
              Purchase confirmed. Your track is now available in your downloads.
            </div>
          )}

          {checkoutError && (
            <div className='cmc-profile-notice cmc-profile-notice--error' role='alert'>
              {checkoutError}
            </div>
          )}

          <section className='cmc-profile-library' aria-labelledby='profile-downloads-heading'>
            <div className='cmc-profile-section-heading'>
              <div>
                <p className='cmc-profile-kicker'>Download library</p>
                <h2 id='profile-downloads-heading'>Downloaded tracks</h2>
              </div>
              <p>
                Showing {filteredPurchasedTracks.length} of {userPurchasedTracks.length}
              </p>
            </div>

            <div className='cmc-profile-searchbar'>
              <label className='cmc-sr-only' htmlFor='profile-track-search'>Search downloaded tracks</label>
              <Search aria-hidden='true' strokeWidth={1.8} />
              <input
                id='profile-track-search'
                onChange={event => setSearch(event.target.value)}
                placeholder='Search downloaded tracks'
                type='search'
                value={search}
              />
              <button
                aria-label='Clear search'
                className='cmc-profile-search-clear'
                disabled={!search}
                onClick={() => setSearch('')}
                type='button'
              >
                <X aria-hidden='true' strokeWidth={2} />
              </button>
              <label>
                <span>Composer</span>
                <select value={composerFilter} onChange={event => setComposerFilter(event.target.value)}>
                  <option value='all'>All composers</option>
                  {composerOptions.map(composer => (
                    <option key={composer} value={composer}>{composer}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Key</span>
                <select value={keyFilter} onChange={event => setKeyFilter(event.target.value)}>
                  <option value='all'>All keys</option>
                  {keyOptions.map(trackKey => (
                    <option key={trackKey} value={trackKey}>{trackKey}</option>
                  ))}
                </select>
              </label>
            </div>

            <TrackTable
              emptyAction={(
                <Button as={Link} href='/catalogue' variant='paper'>
                  Browse Archive
                </Button>
              )}
              emptyText='Purchased tracks will appear here with secure download links after checkout.'
              emptyTitle={userPurchasedTracks.length === 0 ? 'No downloads yet' : 'No matching downloads'}
              tracks={filteredPurchasedTracks}
            />
          </section>

          <section className='cmc-profile-secondary-grid' aria-label='Profile sections'>
            {secondaryPanels.map(panel => (
              <article className='cmc-profile-secondary-panel' key={panel.label}>
                <span>{panel.value}</span>
                <h2>{panel.label}</h2>
                <p>{panel.text}</p>
                {panel.items?.length > 0 && (
                  <ul>
                    {panel.items.map(item => (
                      <li key={`${panel.label}-${item.title}-${item.meta}`}>
                        {item.href ? (
                          <Link href={item.href}>{item.title}</Link>
                        ) : (
                          <strong>{item.title}</strong>
                        )}
                        <small>{item.meta}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </section>

          {(canUpload || canAccessOperations) && (
            <section className='cmc-profile-role-grid' aria-label='Role tools'>
              {canUpload && (
                <article className='cmc-profile-role-panel cmc-profile-role-panel--uploader'>
                  <UploadCloud aria-hidden='true' strokeWidth={1.7} />
                  <div>
                    <p className='cmc-profile-kicker'>Uploader workspace</p>
                    <h2>Your uploaded tracks</h2>
                    <p>
                      Manage review state, published tracks and future uploader performance metrics.
                    </p>
                    <dl>
                      <div>
                        <dt>Uploaded</dt>
                        <dd>{userUploadedTracks.length}</dd>
                      </div>
                      <div>
                        <dt>Approved access</dt>
                        <dd>{currentUser.uploaderStatus?.toLowerCase() || 'pending'}</dd>
                      </div>
                    </dl>
                    <div className='cmc-profile-role-actions'>
                      <Button as={Link} href='/upload' variant='ink'>
                        Upload track
                      </Button>
                      <Button as={Link} href='/catalogue' variant='paper'>
                        View catalogue
                      </Button>
                    </div>
                  </div>
                </article>
              )}

              {canAccessOperations && (
                <article className='cmc-profile-role-panel cmc-profile-role-panel--operations'>
                  <ShieldCheck aria-hidden='true' strokeWidth={1.7} />
                  <div>
                    <p className='cmc-profile-kicker'>Operations</p>
                    <h2>Support and admin tools</h2>
                    <p>
                      Elevated users can move into review, audit and account-management workflows.
                    </p>
                    <Button as={Link} href='/admin' variant='paper'>
                      Open admin
                    </Button>
                  </div>
                </article>
              )}
            </section>
          )}
        </section>
      </div>
    </main>
  )
}

export default memo(ProfilePageContent)
