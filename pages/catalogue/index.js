import React, { useMemo, useState, memo } from 'react'
import Link from 'next/link'
import PlaySample from '../../components/PlaySample'
import { Container, Button, Row, Col, Form } from 'react-bootstrap'
import prisma from '../../lib/server/prisma'
import { publicTrackWhere } from '../../lib/server/tracks-core.mjs'

export const getServerSideProps = async () => {
  const tracks = await prisma.track.findMany({
    where: publicTrackWhere,
    include: {
      uploadedBy: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [
      {
        composer: 'asc'
      },
      {
        title: 'asc'
      }
    ]
  })

  const catalogueTracks = tracks.map(track => ({
    ...track,
    uploadedAt: track.uploadedAt.toLocaleDateString(),
    uploaderName: track.uploadedBy?.name || 'Unknown',
    uploadedBy: null
  }))

  return {
    props: {
      tracks: catalogueTracks
    }
  }
}

const normalise = value => `${value || ''}`.toLowerCase()

const formatDuration = seconds => {
  if (!seconds) {
    return 'Duration TBC'
  }

  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60

  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

const Catalogue = ({ tracks }) => {
  const [searchParam, setSearchParam] = useState('')
  const [previewTrackId, setPreviewTrackId] = useState(null)

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
      track.formattedPrice
    ].some(value => normalise(value).includes(query)))
  }, [searchParam, tracks])

  const featuredTrack = filteredTracks[0] || tracks[0]

  return (
    <main className='cmc-catalogue-page'>
      <Container fluid='xl'>
        <section className='cmc-catalogue-hero'>
          <div>
            <p className='cmc-kicker'>Classical Music Catalogue</p>
            <h1>Track Listing</h1>
            <p className='cmc-catalogue-copy'>
              Search backing-track studies by title, composer, key, instrumentation, uploader, or price.
            </p>
          </div>
          <div className='cmc-catalogue-stats' aria-label='Catalogue summary'>
            <div>
              <span>{tracks.length}</span>
              <small>Total tracks</small>
            </div>
            <div>
              <span>{filteredTracks.length}</span>
              <small>Visible now</small>
            </div>
          </div>
        </section>

        <Row className='g-4 align-items-start'>
          <Col lg={4} xl={3}>
            <aside className='cmc-catalogue-panel'>
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
                  variant='secondary'
                  size='sm'
                  onClick={() => setSearchParam(searchParam.trim())}
                >
                  Search
                </Button>
                <Button
                  variant='outline-secondary'
                  size='sm'
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
            </aside>
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
                      <div className='cmc-catalogue-track-heading'>
                        <Link href='/catalogue/[id]' as={`/catalogue/${track.id}`}>
                          {track.title}
                        </Link>
                        <p>{track.composer}</p>
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

                      <div className='cmc-catalogue-row-meta'>Published {track.uploadedAt}</div>
                    </div>

                    <aside className='cmc-catalogue-track-actions' aria-label={`Actions for ${track.title}`}>
                      <strong>{track.formattedPrice || 'TBC'}</strong>
                      <Link href='/catalogue/[id]' as={`/catalogue/${track.id}`} className='cmc-button cmc-button--secondary'>
                        Details
                      </Link>
                      <Button
                        variant={previewTrackId === track.id ? 'secondary' : 'outline-secondary'}
                        size='sm'
                        onClick={() => setPreviewTrackId(previewTrackId === track.id ? null : track.id)}
                      >
                        {previewTrackId === track.id ? 'Hide Preview' : 'Preview'}
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

export default memo(Catalogue)
