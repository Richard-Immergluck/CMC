import { getSession } from 'next-auth/react'
import React, { useEffect, useState, memo } from 'react'
import { useRouter } from 'next/router'
import { useCart } from 'react-use-cart'
import prisma from '../../components/prisma'
import Link from 'next/link'
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
  Badge,
  Alert
} from 'react-bootstrap'
import PlayTrack from '../../components/PlayTrack'

export const getServerSideProps = async context => {
  // Get the session from user
  const session = await getSession({ req: context.req })
  if (session) {
    // Get the user from the database
    const currentUser = await prisma.user.findUnique({
      where: {
        email: session.user.email
      }
    })

    if (!currentUser) {
      return {
        redirect: {
          destination: '/api/auth/signin',
          permanent: false
        }
      }
    }

    const userUploadedTracks = await prisma.track.findMany({
      where: {
        userId: currentUser.id
      }
    })

    userUploadedTracks.map(track => {
      track.uploadedAt = track.uploadedAt.toLocaleDateString()
      return track
    })

    const purchases = await prisma.trackOwner.findMany({
      where: {
        userId: currentUser.id
      },
      include: {
        track: true
      }
    })

    purchases.map(purchase => {
      purchase.purchasedAt = purchase.purchasedAt.toLocaleDateString()
      purchase.track.uploadedAt = purchase.track.uploadedAt.toLocaleDateString()
      return purchase
    })

    const userPurchasedTracks = purchases.map(purchase => purchase.track)

    return {
      props: {
        userUploadedTracks,
        currentUser,
        userPurchasedTracks
      }
    }
  } else {
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    }
  }
}

const UserProfilePage = ({
  currentUser,
  userUploadedTracks,
  userPurchasedTracks
}) => {
  const [key, setKey] = useState('purchased')
  const [checkoutError, setCheckoutError] = useState('')
  const router = useRouter()
  const { emptyCart } = useCart()

  // Image URL from user's OAuth provider test
  const [imageURL] = useState(currentUser.image)

  useEffect(() => {
    const reconcileCheckout = async () => {
      if (router.query.checkout !== 'success') {
        return
      }

      try {
        const response = await fetch('/api/stripe/checkout_sessions/reconcile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(
            router.query.session_id
              ? { sessionId: router.query.session_id }
              : {}
          )
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Unable to confirm purchase')
        }

        if (data.status === 'fulfilled' || data.status === 'already_fulfilled') {
          emptyCart()
          router.replace('/profile?purchase=confirmed', undefined, { shallow: false })
          return
        }

        setCheckoutError('Stripe has not marked this payment as complete yet. Please refresh shortly.')
      } catch (error) {
        setCheckoutError(error.message || 'Unable to confirm purchase')
      }
    }

    reconcileCheckout()
  }, [emptyCart, router, router.query.checkout, router.query.session_id])

  const purchaseConfirmed = router.query.purchase === 'confirmed'

  return (
    <>
      <Container className='mt-5'>
        {purchaseConfirmed && (
          <Alert variant='success'>
            Purchase confirmed. Your track is now available below.
          </Alert>
        )}
        {checkoutError && (
          <Alert variant='danger'>
            {checkoutError}
          </Alert>
        )}
        <Row>
          <Col md={5}>
            <Card style={{ width: '18rem' }}>
              {!imageURL ? (
                <Card.Img
                  variant='top'
                  src={`https://robohash.org/${currentUser.name}.png`}
                />
              ) : (
                <Card.Img variant='top' src={imageURL} />
              )}
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
                    <Button variant='info' onClick={() => setKey('purchased')}>
                      Purchased Tracks:{' '}
                      <Badge bg='secondary'>{userPurchasedTracks.length}</Badge>
                    </Button>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Button variant='info' onClick={() => setKey('uploaded')}>
                      Uploaded Tracks:{' '}
                      <Badge bg='secondary'>{userUploadedTracks.length}</Badge>
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
                        <td>
                          <Link
                            href='/profile/[id]'
                            as={`/profile/${track.id}-${track.userId}`}
                          >
                            {key + 1}
                          </Link>
                        </td>
                        <td>
                          <Link
                            href='/profile/[id]'
                            as={`/profile/${track.id}-${track.userId}`}
                          >
                            {track.title}
                          </Link>
                        </td>
                        <td>
                          <Link
                            href='/profile/[id]'
                            as={`/profile/${track.id}-${track.userId}`}
                          >
                            {track.composer}
                          </Link>
                        </td>
                        <td>
                          <PlayTrack track={track} />
                        </td>
                        <td>
                          <a
                            className='btn btn-info btn-sm active'
                            rel='noreferrer'
                            target='_blank'
                            download={track.downloadName}
                            role='button'
                            href={`/api/tracks/${track.id}/signed-url?mode=download&redirect=1`}
                          >
                            Download
                          </a>
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
                      <th>Play Track</th>
                      <th>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userPurchasedTracks.map((track, key) => (
                      <tr key={track.id}>
                        <td>
                          <Link
                            href='/profile/[id]'
                            as={`/profile/${track.id}-${track.userId}`}
                          >
                            {key + 1}
                          </Link>
                        </td>
                        <td>
                          <Link
                            href='/profile/[id]'
                            as={`/profile/${track.id}-${track.userId}`}
                          >
                            {track.title}
                          </Link>
                        </td>
                        <td>
                          <Link
                            href='/profile/[id]'
                            as={`/profile/${track.id}-${track.userId}`}
                          >
                            {track.composer}
                          </Link>
                        </td>
                        <td>
                          <PlayTrack track={track} />
                        </td>
                        <td>
                          <a
                            className='btn btn-info btn-sm active'
                            rel='noreferrer'
                            target='_blank'
                            download={track.downloadName}
                            role='button'
                            href={`/api/tracks/${track.id}/signed-url?mode=download&redirect=1`}
                          >
                            Download
                          </a>
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

export default memo(UserProfilePage)
