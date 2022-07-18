import { getSession } from 'next-auth/react'
import React, { useState } from 'react'
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
import prisma from '/components/prisma'
import _ from 'lodash'
import PlayTrack from '../../components/PlayTrack'
import GETSignedS3URL from '../../components/GETSignedS3URL'

export const getServerSideProps = async context => {
  try {
    // Get the session from the cookie
    const session = await getSession({ req: context.req })
    if (session) {
      // Get the user from the database
      const currentUser = await prisma.user.findUnique({
        where: {
          email: session.user.email
        }
      })

      // Grab all the tracks from the DB
      const rawTrackData = await prisma.track.findMany()

      // Convert the date object to a locale date string
      const tracksDateToString = rawTrackData.map(track => {
        track.uploadedAt = track.uploadedAt.toLocaleDateString()
        return track
      })

      // Filter the tracks to only those uploaded by the current user
      const userUploadedTracks = tracksDateToString.filter(
        track => track.userId === currentUser.id
      )

      // Grab all the purchases from the DB
      const rawPurchasesData = await prisma.TrackOwner.findMany()

      // Convert the date object to a locale date string
      const purchases = rawPurchasesData.map(purchase => {
        purchase.purchasedAt = purchase.purchasedAt.toLocaleDateString()
        return purchase
      })

      // Filter purchases for those owned by the current user
      const userPurchasedTrackNumbers = purchases.filter(
        purchase => purchase.userId === currentUser.id
      )

      // Get the track objects from the purchase data
      const userPurchasedTracks = tracksDateToString.filter(track =>
        userPurchasedTrackNumbers.some(
          purchase => purchase.trackId === track.id
        )
      )

      return {
        props: {
          userUploadedTracks,
          currentUser,
          userPurchasedTracks
        }
      }
    } else {
      return {
        redirect: '/login',
        permanent: false
      }
    }
  } catch (error) {}
}

const UserProfilePage = ({
  currentUser,
  userUploadedTracks,
  userPurchasedTracks
}) => {
  const [key, setKey] = useState('purchased')

  return (
    <>
      <Container className='mt-5'>
        <Row>
          <Col md={5}>
            <Card style={{ width: '18rem' }}>
              <Card.Img variant='top' src={currentUser.image} />
              <Card.Body>
                <Card.Title>{currentUser.name}</Card.Title>
                <Card.Subtitle className='mb-2 text-muted'>
                  {currentUser.email}
                </Card.Subtitle>
                <Card.Text>
                  Welcome to your profile page! Please use the links below or
                  click on the tabs opposite to view your purchased and uploaded
                  tracks.
                </Card.Text>
                <ListGroup variant='flush'>
                  <ListGroup.Item>
                    <Button variant="info" onClick={() => setKey('purchased')}>
                      Purchased Tracks: <Badge bg="secondary">{userPurchasedTracks.length}</Badge>
                    </Button>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Button variant="info" onClick={() => setKey('uploaded')}>
                      Uploaded Tracks: <Badge bg="secondary">{userUploadedTracks.length}</Badge>
                    </Button>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Tabs
              id='controlled-tab-example'
              activeKey={key}
              onSelect={k => setKey(k)}
              className='mb-3'
            >
              <Tab eventKey='uploaded' title='Uploaded'>
                <Table striped bordered hover responsive size='sm'>
                  <thead>
                    <tr className='table-info'>
                      <th>#</th>
                      <th>Title</th>
                      <th>Composer</th>
                      <th>Play Track</th>
                      <th>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userUploadedTracks.map((track, key) => (
                      <tr key={track.id}>
                        <td>{key + 1}</td>
                        <td>{track.title}</td>
                        <td>{track.composer}</td>
                        <td>
                          <PlayTrack track={track} />
                        </td>
                        <td>
                          <Button size='sm' variant='info'>
                            <a
                              href={GETSignedS3URL({
                                bucket: 'backingtrackstorage',
                                key: `${track.fileName}`,
                                expires: 60
                              })}
                            >
                              Download
                            </a>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab>
              <Tab eventKey='purchased' title='Purchased'>
                <Table striped bordered hover responsive size='sm'>
                  <thead>
                    <tr className='table-info'>
                      <th>#</th>
                      <th>Title</th>
                      <th>Composer</th>
                      <th>Preview</th>
                      <th>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userPurchasedTracks.map((track, key) => (
                      <tr key={track.id}>
                        <td>{key + 1}</td>
                        <td>{track.title}</td>
                        <td>{track.composer}</td>
                        <td>
                          <PlayTrack track={track} />
                        </td>
                        <td>
                          <Button size='sm' variant='info'>
                            <a
                              href={GETSignedS3URL({
                                bucket: 'backingtrackstorage',
                                key: `${track.fileName}`,
                                expires: 60
                              })}
                            >
                              Download
                            </a>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default UserProfilePage
