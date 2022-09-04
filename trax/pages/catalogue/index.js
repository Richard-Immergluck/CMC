import React, { useEffect, useState, memo } from 'react'
import Link from 'next/link'
import PlaySample from '../../components/PlaySample'
import prisma from '/components/prisma'
import { Container, Table, Button, Row, Col } from 'react-bootstrap'
import _ from 'lodash'

export const getStaticProps = async () => {
  // Grab all the tracks from the DB
  const tracks = await prisma.track.findMany()

  // Convert the date object to a locale date string
  tracks.map(track => {
    track.uploadedAt = track.uploadedAt.toLocaleDateString()
    return track
  })

  const users = await prisma.user.findMany()

  return {
    props: {
      tracks,
      users
    }
  }
}

const pageSize = 30

const Catalogue = ({ tracks, users }) => {
  const [searchParam, setSearchParam] = useState('')
  const [filterParam, setFilterParam] = useState('')
  const [searchPressed, setSearchPressed] = useState(false)
  const [paginatedTracks, setPaginatedTracks] = useState([])
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setPaginatedTracks(() => _(tracks).slice(0).take(pageSize).value())
  }, [])

  const pageCount = tracks ? Math.ceil(tracks.length / pageSize) : 0

  const pages = _.range(1, pageCount + 1)

  const pagination = pageNumber => {
    setCurrentPage(pageNumber)
    const startIndex = (pageNumber - 1) * pageSize
    const paginatedTrack = _(tracks).slice(startIndex).take(pageSize).value()
    setPaginatedTracks(paginatedTrack)
  }

  // Function to attach uploader name to track for display
  const userTrackMatch = (userId, users) => {
    const user = _.find(users, { id: userId })
    return user ? user.name : 'Unknown'
  }

  return (
    <>
      <div>
        <h1 className='title mt-3 mb-3' align='center'>
          Track Listing
        </h1>
        {!searchPressed ? (
          <Container>
            <Row className='input-group justify-content-md-center'>
              <Col xs={12} md={9} lg={6} xl={5} xxl={5}>
                <Container className='input-group mb-3 bg-light border mt-5 p-3'>
                  <input
                    type='text'
                    id='search param'
                    placeholder='Search'
                    className='form-control'
                    onChange={e => setSearchParam(e.target.value)}
                  />
                  <Button
                    variant='outline-info'
                    onClick={() => {
                      if (searchParam) {
                        setSearchPressed(true)
                        setFilterParam(searchParam)
                      }
                    }}
                  >
                    Search
                  </Button>
                </Container>
              </Col>
            </Row>
          </Container>
        ) : (
          <Container>
            <Row className='input-group justify-content-md-center'>
              <Col xs={12} md={9} lg={6} xl={5} xxl={5}>
                <Button
                  className='input-group mb-3 bg-light border mt-5 p-3 justify-content-md-center'
                  variant='outline-info'
                  onClick={() => {
                    setFilterParam('')
                    setSearchPressed(false)
                  }}
                >
                  Reset Search
                </Button>
              </Col>
            </Row>
          </Container>
        )}
        <Container className='Catalogue div'>
          <Table striped bordered hover responsive size='sm'>
            <thead>
              <tr className='table-info'>
                <th>#</th>
                <th>Title</th>
                <th>Composer</th>
                <th>Uploader</th>
                <th>Price</th>
                <th>Preview</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTracks
                .filter(track => {
                  if (filterParam === '') {
                    return track
                  } else if (
                    track.title
                      .toLowerCase()
                      .includes(searchParam.toLowerCase()) ||
                    track.composer
                      .toLowerCase()
                      .includes(searchParam.toLowerCase()) ||
                    userTrackMatch(track.userId, users)
                      .toLowerCase()
                      .includes(searchParam.toLowerCase())
                  ) {
                    return track
                  }
                })
                .map((track, key) => (
                  <tr key={track.id}>
                    <td>
                      <Link
                        href='/catalogue/[id]'
                        as={`/catalogue/${track.id}`}
                      >
                        {key + 1}
                      </Link>
                    </td>
                    <td>
                      <Link
                        href='/catalogue/[id]'
                        as={`/catalogue/${track.id}`}
                      >
                        {track.title}
                      </Link>
                    </td>
                    <td>
                      <Link
                        href='/catalogue/[id]'
                        as={`/catalogue/${track.id}`}
                      >
                        {track.composer}
                      </Link>
                    </td>
                    <td>{userTrackMatch(track.userId, users)}</td>
                    <td>{track.formattedPrice}</td>
                    <td>
                      <PlaySample
                        track={track}
                        start={track.previewStart}
                        stop={track.previewEnd}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </Table>
          {pages.length > 1 ? (
            <nav className='d-flex justify-content-center'>
              <ul className='pagination'>
                {pages.map(page => (
                  <li
                    key={page}
                    className={
                      page === currentPage ? 'page-item active' : 'page-item'
                    }
                  >
                    <p
                      className='page-link'
                      onClick={() => {
                        pagination(page)
                      }}
                    >
                      {page}
                    </p>
                  </li>
                ))}
              </ul>
            </nav>
          ) : (
            <></>
          )}
          <Button variant='info'>
            <Link href={'/'}>
              <a>Back to Home Page</a>
            </Link>
          </Button>
        </Container>
      </div>
    </>
  )
}

export default memo(Catalogue)
