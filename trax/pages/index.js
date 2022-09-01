import Head from 'next/head'
import styles from '../styles/Home.module.css'
import prisma from '/components/prisma'
import PlaySample from '/components/PlaySample'
import { Table } from 'react-bootstrap'

export const getServerSideProps = async () => {
  // Grab all the tracks from the DB in order they were uploaded descending
  const rawTrackData = await prisma.track.findMany({
    orderBy: [
      {
        uploadedAt: 'desc'
      }
    ],
    take: 5
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

const Home = ({ tracks }) => {

  return (
    <>
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
          <h2>Welcome to</h2>
          <h1 className={styles.title}>C.M.B.C</h1>
          <h4> - the Classical Music Backing-Track Catalogue - </h4>

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
              {tracks.map((track, key) => (
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
    </>
  )
}

export default Home
