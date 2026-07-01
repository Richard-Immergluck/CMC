'use client'

import { memo, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from 'react-use-cart'
import Link from 'next/link'
import {
  Alert,
  Badge,
  Card,
  Col,
  Container,
  ListGroup,
  Row,
  Tab,
  Table,
  Tabs
} from 'react-bootstrap'
import PlayTrack from '../../PlayTrack'
import { Button } from '../../ui/primitives'

const ProfilePageContent = ({
  checkout,
  checkoutSessionId,
  currentUser,
  purchase,
  userUploadedTracks,
  userPurchasedTracks
}) => {
  const [key, setKey] = useState('purchased')
  const [checkoutError, setCheckoutError] = useState('')
  const router = useRouter()
  const { emptyCart } = useCart()
  const imageURL = currentUser.image

  useEffect(() => {
    const reconcileCheckout = async () => {
      if (checkout !== 'success') {
        return
      }

      if (!checkoutSessionId) {
        emptyCart()
        setCheckoutError('Checkout returned without a session id, so the purchase could not be confirmed automatically.')
        return
      }

      try {
        const response = await fetch('/api/stripe/checkout_sessions/reconcile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: checkoutSessionId
          })
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Unable to confirm purchase')
        }

        if (data.status === 'fulfilled' || data.status === 'already_fulfilled') {
          emptyCart()
          router.replace('/profile?purchase=confirmed')
          router.refresh()
          return
        }

        setCheckoutError('Stripe has not marked this payment as complete yet. Please refresh shortly.')
      } catch (error) {
        setCheckoutError(error.message || 'Unable to confirm purchase')
      }
    }

    reconcileCheckout()
  }, [checkout, checkoutSessionId, emptyCart, router])

  const purchaseConfirmed = purchase === 'confirmed'

  const renderTrackRows = tracks => tracks.map((track, index) => (
    <tr key={track.id}>
      <td>
        <Link href={`/profile/${track.id}-${track.userId}`}>
          {index + 1}
        </Link>
      </td>
      <td>
        <Link href={`/profile/${track.id}-${track.userId}`}>
          {track.title}
        </Link>
      </td>
      <td>
        <Link href={`/profile/${track.id}-${track.userId}`}>
          {track.composer}
        </Link>
      </td>
      <td>
        <PlayTrack track={track} />
      </td>
      <td>
        <Button
          as='a'
          className='cmc-profile-download-button'
          size='sm'
          variant='secondary'
          rel='noreferrer'
          target='_blank'
          download={track.downloadName}
          href={`/api/tracks/${track.id}/signed-url?mode=download&redirect=1`}
        >
          Download
        </Button>
      </td>
    </tr>
  ))

  return (
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
                  <Button
                    className='cmc-profile-tab-button'
                    size='sm'
                    variant='secondary'
                    onClick={() => setKey('purchased')}
                  >
                    Purchased Tracks:{' '}
                    <Badge bg='secondary'>{userPurchasedTracks.length}</Badge>
                  </Button>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Button
                    className='cmc-profile-tab-button'
                    size='sm'
                    variant='secondary'
                    onClick={() => setKey('uploaded')}
                  >
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
            onSelect={selectedKey => setKey(selectedKey)}
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
                  {renderTrackRows(userUploadedTracks)}
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
                  {renderTrackRows(userPurchasedTracks)}
                </tbody>
              </Table>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  )
}

export default memo(ProfilePageContent)
