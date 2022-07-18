import Head from 'next/head'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import styles from '../styles/Home.module.css'
import prisma from '/components/prisma'
import PlaySample from '/components/PlaySample'
import _ from 'lodash'
import {
  Container,
  Card,
  Button,
  ListGroup,
  Row,
  Col,
  Tabs,
  Tab,
  Table,
  Badge
} from 'react-bootstrap'
import GETSignedS3URL from '/components/GETSignedS3URL'

export const getServerSideProps = async () => {
  // Grab all the tracks from the DB
  const rawTrackData = await prisma.track.findMany({
    orderBy: [
      {
        uploadedAt: 'desc'
      }
    ]
  })

  // Convert the date object to a locale date string
  const tracks = rawTrackData.map(track => {
    track.uploadedAt = track.uploadedAt.toLocaleDateString()
    return track
  })

  return {
    props: {
      tracks
    }
  }
}

const pageSize = 5

const Home = ({ tracks }) => {
  const { data: session, status } = useSession()
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

  return (
    <div className={styles.container}>
      <Head>
        <title>CMC</title>
        <meta
          name='Classical Music Catalogue'
          content='Classical Backing Track Catalogue'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to the Classical Music Catalogue
        </h1>
        
        <h5 className='mt-5'>
          Here is a short list of the most recent uploads!
        </h5>
        <Table striped bordered hover responsive size='sm'>
          <thead>
            <tr className='table-info'>
              <th>#</th>
              <th>Title</th>
              <th>Composer</th>
              <th>Play Track</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTracks.map((track, key) => (
              <tr key={track.id}>
                <td>{key + 1}</td>
                <td>{track.title}</td>
                <td>{track.composer}</td>
                <td>
                  <PlaySample track={track} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </main>

      <footer className={styles.footer}></footer>
    </div>
  )
}

export default Home
