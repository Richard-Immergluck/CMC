'use client'

import { memo, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Col, Container, Form, Row } from 'react-bootstrap'
import PlaySample from '../../PlaySample'
import { Button, Panel } from '../../ui/primitives'

const normalise = value => `${value || ''}`.toLowerCase()

const formatDuration = seconds => {
  if (!seconds) {
    return 'Duration TBC'
  }

  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60

  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

const countUnique = (tracks, field) => new Set(
  tracks
    .map(track => track[field])
    .filter(Boolean)
).size

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

  const featuredTrack = filteredTracks[0] || tracks[0]
  const composerCount = useMemo(() => countUnique(tracks, 'composer'), [tracks])
  const uploaderCount = useMemo(() => countUnique(tracks, 'uploaderName'), [tracks])
  const previewableCount = useMemo(() => tracks.filter(hasPreview).length, [tracks])

  return (
    <main className='cmc-catalogue-page'>
      <Container fluid='xl'>
        <section className='cmc-catalogue-hero'>
          <div>
            <p className='cmc-kicker'>Classical Music Catalogue</p>
            <h1>Track Listing</h1>
            <p className='cmc-catalogue-copy'>
              Search a growing archive of backing tracks, reductions, studies, and rehearsal recordings shared by classical musicians.
            </p>
          </div>
          <div className='cmc-catalogue-stats' aria-label='Catalogue summary'>
            <div>
              <span>{tracks.length}</span>
              <small>Total tracks</small>
            </div>
            <div>
              <span>{composerCount}</span>
              <small>Composers</small>
            </div>
            <div>
              <span>{uploaderCount}</span>
              <small>Uploaders</small>
            </div>
            <div>
              <span>{previewableCount}</span>
              <small>Previews</small>
            </div>
          </div>
        </section>

        <Row className='g-4 align-items-start'>
          <Col lg={4} xl={3}>
            <Panel as='aside' className='cmc-catalogue-panel' tone='accent'>
              <div className='cmc-catalogue-panel-heading'>
                <span>Browse archive</span>
                <strong>{filteredTracks.length} result{filteredTracks.length === 1 ? '' : 's'}</strong>
              </div>
              <Form.Group controlId='catalogue-search'>
                <Form.Label>Search catalogue</Form.Label>
                <Form.Control
                  type='search'
                  value={searchParam}
                  placeholder='Try Beethoven, cadence, G minor...'
                  onChange={event => setSearchParam(event.target.value)}
                />
              </Form.Group>
              <div className='cmc-catalogue-actions'>
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={() => setSearchParam(searchParam.trim())}
                >
                  Search
                </Button>
                <Button
                  size='sm'
                  variant='subtle'
                  disabled={!searchParam}
                  onClick={() => {
                    setSearchParam('')
                    setPreviewTrackId(null)
                  }}
                >
                  Reset
                </Button>
              </div>
              {featuredTrack && (
                <div className='cmc-featured-track'>
                  <span>First result</span>
                  <strong>{featuredTrack.title}</strong>
                  <small>{featuredTrack.composer}</small>
                </div>
              )}
              <div className='cmc-catalogue-public-note'>
                <strong>Public preview</strong>
                <p>Samples and track details are open to browse. Purchases, downloads, and comments start after sign-in.</p>
              </div>
            </Panel>
          </Col>

          <Col lg={8} xl={9}>
            <section className='cmc-catalogue-results-shell' aria-label='Catalogue results'>
              <div className='cmc-catalogue-table-header'>
                <div>
                  <h2>Available tracks</h2>
                  <p>{filteredTracks.length} result{filteredTracks.length === 1 ? '' : 's'} ready for preview.</p>
                </div>
                <Link href='/' className='cmc-catalogue-home-link'>
                  Home
                </Link>
              </div>

              <div className='cmc-catalogue-result-list'>
                {filteredTracks.map((track, index) => (
                  <article className='cmc-catalogue-track-card' key={track.id}>
                    <div className='cmc-catalogue-track-index'>{index + 1}</div>

                    <div className='cmc-catalogue-track-main'>
                      <div className='cmc-catalogue-track-eyebrow'>
                        <span>{track.composer || 'Unknown composer'}</span>
                        <span>{track.formattedPrice || 'TBC'}</span>
                      </div>
                      <div className='cmc-catalogue-track-heading'>
                        <Link href={`/catalogue/${track.id}`}>
                          {track.title}
                        </Link>
                        <p>{getTrackDescription(track)}</p>
                      </div>

                      <dl className='cmc-catalogue-track-meta'>
                        <div>
                          <dt>Key</dt>
                          <dd>{track.key || 'Unspecified'}</dd>
                        </div>
                        <div>
                          <dt>Instrumentation</dt>
                          <dd>{track.instrumentation || 'Unspecified'}</dd>
                        </div>
                        <div>
                          <dt>Uploader</dt>
                          <dd>{track.uploaderName}</dd>
                        </div>
                        <div>
                          <dt>Duration</dt>
                          <dd>{formatDuration(track.durationSeconds)}</dd>
                        </div>
                      </dl>

                      <div className='cmc-catalogue-row-meta'>
                        <span>Published {track.uploadedAt}</span>
                        <span>{hasPreview(track) ? 'Sample available' : 'Details only'}</span>
                      </div>
                      <div className='cmc-catalogue-track-signal' aria-label='Catalogue metadata markers'>
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>

                    <aside className='cmc-catalogue-track-actions' aria-label={`Actions for ${track.title}`}>
                      <strong>{track.formattedPrice || 'TBC'}</strong>
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
                  </article>
                ))}

                {filteredTracks.length === 0 && (
                  <div className='cmc-empty-results'>
                    No tracks matched that search.
                  </div>
                )}
              </div>
            </section>
          </Col>
        </Row>
      </Container>
    </main>
  )
}

export default memo(CataloguePageContent)
