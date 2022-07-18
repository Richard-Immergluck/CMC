import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import PlaySample from '../../components/PlaySample'
import prisma from '/components/prisma'
import { Container, Table, Button } from 'react-bootstrap'
import _ from 'lodash'

export const getStaticProps = async () => {
  // Grab all the tracks from the DB
  const rawTrackData = await prisma.track.findMany()

  // Convert the date object to a locale date string
  const tracks = rawTrackData.map(track => {
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

const pageSize = 10

const Catalogue = ({ tracks, users }) => {
  const [paginatedTracks, setPaginatedTracks] = useState([])
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setPaginatedTracks(_(tracks).slice(0).take(pageSize).value())
  }, [])

  const pageCount = tracks ? Math.ceil(tracks.length / pageSize) : 0
  if (pageCount === 1) {
    return null
  }

  const pages = _.range(1, pageCount + 1)

  const pagination = pageNumber => {
    setCurrentPage(pageNumber)
    const startIndex = (pageNumber - 1) * pageSize
    const paginatedTrack = _(tracks).slice(startIndex).take(pageSize).value()
    setPaginatedTracks(paginatedTrack)
  }

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
              {paginatedTracks.map((track, key) => (
                <tr key={track.id}>
                  <td>
                    <Link href='/catalogue/[id]' as={`/catalogue/${track.id}`}>
                      {key + 1}
                    </Link>
                  </td>
                  <td>
                    <Link href='/catalogue/[id]' as={`/catalogue/${track.id}`}>
                      <p>{track.title}</p>
                    </Link>
                  </td>
                  <td>{track.composer}</td>
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

export default Catalogue
