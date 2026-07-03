'use client'

import { memo, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Container, Form } from 'react-bootstrap'
import PlaySample from '../../PlaySample'
import { Button } from '../../ui/primitives'

const normalise = value => `${value || ''}`.toLowerCase()

const formatDuration = seconds => {
  if (!seconds) {
    return 'Duration TBC'
  }

  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60

  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

const hasPreview = track => track.previewStart !== null && track.previewEnd !== null

const getTrackDescription = track => {
  const detail = track.additionalInfo || track.instrumentation || track.key

  if (!detail) {
    return 'Preview the sample, inspect the arrangement details, and sign in when you are ready to buy.'
  }

  return detail.length > 150 ? `${detail.slice(0, 147)}...` : detail
}

const CataloguePageContent = ({ tracks }) => {
  const { data: session } = useSession()
  const [searchParam, setSearchParam] = useState('')
  const [previewTrackId, setPreviewTrackId] = useState(null)
  const isAuthenticated = Boolean(session)

  const filteredTracks = useMemo(() => {
    const query = normalise(searchParam).trim()

    if (!query) {
      return tracks
    }

    return tracks.filter(track => [
      track.title,
      track.composer,
      track.uploaderName,
      track.key,
      track.instrumentation,
      track.formattedPrice,
      track.additionalInfo
    ].some(value => normalise(value).includes(query)))
  }, [searchParam, tracks])

  return (
    <main className='cmc-catalogue-page'>
      <Container fluid='xl'>
        <section className='cmc-catalogue-board' aria-labelledby='catalogue-heading'>
          <div className='cmc-catalogue-board-rail' aria-hidden='true' />

          <div className='cmc-catalogue-board-header'>
            <div>
              <h1 id='catalogue-heading'>Browse Archive</h1>
            </div>

            <Form.Group controlId='catalogue-search' className='cmc-catalogue-search'>
              <Form.Label className='visually-hidden'>Search catalogue</Form.Label>
              <Form.Control
                type='search'
                value={searchParam}
                placeholder='Search'
                onChange={event => setSearchParam(event.target.value)}
              />
            </Form.Group>
          </div>

          <div className='cmc-catalogue-toolbar'>
            <span>
              Showing {filteredTracks.length} of {tracks.length} tracks
            </span>
            {searchParam && (
              <Button
                size='sm'
                variant='subtle'
                onClick={() => {
                  setSearchParam('')
                  setPreviewTrackId(null)
                }}
              >
                Clear Search
              </Button>
            )}
          </div>

          <section className='cmc-catalogue-results-shell' aria-label='Catalogue results'>
            <div className='cmc-catalogue-table-header' aria-hidden='true'>
              <span />
              <span>Title</span>
              <span>Composer</span>
              <span>Key</span>
              <span>Instrumentation</span>
              <span>Uploader</span>
              <span>Price</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            <div className='cmc-catalogue-result-list'>
              {filteredTracks.map((track, index) => (
                <article className='cmc-catalogue-track-card' key={track.id}>
                  <div className='cmc-catalogue-track-row'>
                    <div className='cmc-catalogue-track-index'>{String(index + 1).padStart(2, '0')}</div>

                    <div className='cmc-catalogue-track-title-cell'>
                      <div className='cmc-catalogue-track-heading'>
                        <Link href={`/catalogue/${track.id}`}>
                          {track.title}
                        </Link>
                        <p>{getTrackDescription(track)}</p>
                      </div>

                      <span className='cmc-catalogue-row-meta'>Published {track.uploadedAt}</span>
                    </div>

                    <div className='cmc-catalogue-track-field' data-label='Composer'>
                      {track.composer || 'Unknown composer'}
                    </div>
                    <div className='cmc-catalogue-track-field' data-label='Key'>
                      {track.key || 'Unspecified'}
                    </div>
                    <div className='cmc-catalogue-track-field' data-label='Instrumentation'>
                      {track.instrumentation || 'Unspecified'}
                    </div>
                    <div className='cmc-catalogue-track-field' data-label='Uploader'>
                      {track.uploaderName}
                    </div>
                    <div className='cmc-catalogue-track-price' data-label='Price'>
                      {track.formattedPrice || 'TBC'}
                    </div>
                    <div className='cmc-catalogue-track-status' data-label='Status'>
                      <span>{hasPreview(track) ? 'Preview' : 'Details'}</span>
                      <span>{formatDuration(track.durationSeconds)}</span>
                    </div>

                    <aside className='cmc-catalogue-track-actions' aria-label={`Actions for ${track.title}`}>
                      <Button as={Link} href={`/catalogue/${track.id}`} variant='secondary'>
                        Details
                      </Button>
                      <Button
                        size='sm'
                        variant={previewTrackId === track.id ? 'secondary' : 'subtle'}
                        onClick={() => setPreviewTrackId(previewTrackId === track.id ? null : track.id)}
                      >
                        {previewTrackId === track.id ? 'Hide Preview' : 'Preview'}
                      </Button>
                      <Button
                        as={Link}
                        href={isAuthenticated ? `/catalogue/${track.id}` : `/auth/signin?callbackUrl=/catalogue/${track.id}`}
                        size='sm'
                        variant='paper'
                      >
                        {isAuthenticated ? 'Open Track' : 'Sign In to Buy'}
                      </Button>
                    </aside>

                    {previewTrackId === track.id && (
                      <div className='cmc-preview-player'>
                        <PlaySample track={track} />
                      </div>
                    )}
                  </div>
                </article>
              ))}

              {filteredTracks.length === 0 && (
                <div className='cmc-empty-results'>
                  No tracks matched that search.
                </div>
              )}
            </div>
          </section>
        </section>
      </Container>
    </main>
  )
}

export default memo(CataloguePageContent)
