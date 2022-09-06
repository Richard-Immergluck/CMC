import Head from 'next/head'
import prisma from '/components/prisma'
import PlaySample from '/components/PlaySample'
import { Table, Container, Row, Col } from 'react-bootstrap'

export const getServerSideProps = async () => {
  // Grab all the tracks from the DB in order they were uploaded descending
  const fiveTracks = await prisma.track.findMany({
    orderBy: [
      {
        uploadedAt: 'desc'
      }
    ],
    take: 5
  })

  // Convert the date object in fiveTracks to a locale date string
  fiveTracks.map(track => {
    track.uploadedAt = track.uploadedAt.toLocaleDateString()
    return track
  })

  const allTracks = await prisma.track.findMany()

  // Convert the date object in all tracks to a locale date string
  allTracks.map(track => {
    track.uploadedAt = track.uploadedAt.toLocaleDateString()
    return track
  })

  return {
    props: {
      fiveTracks,
      allTracks
    }
  }
}

const Home = ({ fiveTracks, allTracks }) => {
  return (
    <>
      <div>
        <Head>
          <title>CMBC</title>
          <meta
            name='Classical Music Backing-Track Catalogue'
            content='Classical Music Backing-Track Catalogue'
          />
        </Head>

        <main>
          <Container className='text-center mt-5'>
            <Row className='justify-content-md-center'>
              <Col xs={12} md={9} lg={6} xl={5} xxl={5}>
                <h2>Welcome to</h2>
                <h1>C.M.B.C</h1>
                <h4>Classical Music Backing-Track Catalogue</h4>
              </Col>
            </Row>
          </Container>
          <Container className='bg-light border mt-5 p-3' style={{width: 700}}>
            <h5 className='mt-1 text-center'>
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
                {fiveTracks.map((track, key) => (
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
          </Container>
        </main>
      </div>
    </>
  )
}

export default Home
