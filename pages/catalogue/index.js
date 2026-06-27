import React, { useMemo, useState, memo } from 'react'
import Link from 'next/link'
import PlaySample from '../../components/PlaySample'
import { Container, Table, Button, Row, Col, Form } from 'react-bootstrap'
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
            <section className='cmc-catalogue-table-shell' aria-label='Catalogue results'>
              <div className='cmc-catalogue-table-header'>
                <div>
                  <h2>Available tracks</h2>
                  <p>{filteredTracks.length} result{filteredTracks.length === 1 ? '' : 's'} ready for review.</p>
                </div>
                <Link href='/' className='cmc-catalogue-home-link'>
                  Home
                </Link>
              </div>
              <div className='cmc-catalogue-table-scroll'>
                <Table responsive hover size='sm' className='cmc-catalogue-table'>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Track</th>
                      <th>Composer</th>
                      <th>Key</th>
                      <th>Instrumentation</th>
                      <th>Uploader</th>
                      <th>Price</th>
                      <th>Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTracks.map((track, index) => (
                      <tr key={track.id}>
                        <td>{index + 1}</td>
                        <td>
                          <Link href='/catalogue/[id]' as={`/catalogue/${track.id}`}>
                            {track.title}
                          </Link>
                          <div className='cmc-catalogue-row-meta'>{track.uploadedAt}</div>
                        </td>
                        <td>{track.composer}</td>
                        <td>{track.key || 'Unspecified'}</td>
                        <td>{track.instrumentation || 'Unspecified'}</td>
                        <td>{track.uploaderName}</td>
                        <td>{track.formattedPrice || 'TBC'}</td>
                        <td className='cmc-preview-cell'>
                          <Button
                            variant={previewTrackId === track.id ? 'secondary' : 'outline-secondary'}
                            size='sm'
                            onClick={() => setPreviewTrackId(previewTrackId === track.id ? null : track.id)}
                          >
                            {previewTrackId === track.id ? 'Hide' : 'Preview'}
                          </Button>
                          {previewTrackId === track.id && (
                            <div className='cmc-preview-player'>
                              <PlaySample track={track} />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredTracks.length === 0 && (
                      <tr>
                        <td colSpan='8' className='cmc-empty-results'>
                          No tracks matched that search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </section>
          </Col>
        </Row>
      </Container>
    </main>
  )
}

export default memo(Catalogue)
