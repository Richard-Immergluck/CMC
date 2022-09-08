import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import prisma from '/components/prisma'
import Link from 'next/link'
import GETSignedS3URL from '../../components/GETSignedS3URL'
import dynamic from 'next/dynamic' // needed for 'Self is not defined' error
import { useCart } from 'react-use-cart'
import { Container, Button } from 'react-bootstrap'
import _ from 'lodash'

// Create dynamic routes
export const getStaticPaths = async () => {
  const data = await prisma.track.findMany()

  const paths = data.map(track => {
    return {
      params: {
        trackId: `${track.id}`
      }
    }
  })

  return {
    paths,
    fallback: 'blocking'
  }
}

// Retrieve the individual track from DB
export const getStaticProps = async context => {
  const { params } = context

  const track = await prisma.track.findUnique({
    where: {
      id: Number(params.trackId)
    }
  })

  // Convert the track date object to a locale date string
  track.uploadedAt = track.uploadedAt.toLocaleDateString()

  // Retrieve the users from DB to match user with track
  const users = await prisma.user.findMany()

  // Retrieve the comments from DB
  const comments = await prisma.comment.findMany({
    where: {
      track: {
        id: Number(params.trackId)
      }
    }
  })

  // Convert the date element of each comment to a locale date string
  comments.map(comment => {
    return (comment.createdAt = comment.createdAt.toLocaleDateString())
  })

  return {
    props: {
      track,
      users,
      comments
    }
  }
}

const SingleTrack = ({ track, users, comments }) => {

  const [cartotal, setCartotal] = useState(0)

  const { data: session} = useSession()

  // needed for 'Self is not defined' error
  const WaveFormRegion = dynamic(
    () => import('../../components/WaveFormRegion'),
    { ssr: false }
  )

  // Generate the presigned url
  const url = GETSignedS3URL({
    bucket: process.env.S3_BUCKET_NAME,
    key: `${track.fileName}`,
    expires: 60
  })

  // Instantiate useCart hook
  const { addItem, items } = useCart()

  // Add track to the cart function
  const addToCart = () => {
    addItem({ ...track })
    alert('Track added to cart!')
    setCartotal(items)
  }

  const userTrackMatch = (userId, users) => {
    const user = _.find(users, { id: userId })
    return user ? user.name : 'Unknown'
  }

  // Render the JSX
  return (
    <>
      <Container className='bg-light border mt-5 p-3'>
        <h2>{track.title}</h2>
        <p>by {track.composer}</p>
        <p>
          Uploaded by {userTrackMatch(track.userId, users)} on{' '}
          {track.uploadedAt}
        </p>
        <p>Key: {track.key}</p>
        <p>Instrumentation: {track.instrumentation}</p>
        <p>
          Additional Information:<br />
          {track.additionalInfo}
        </p>
        <br />
        <WaveFormRegion url={url} />
        <br />
        <br />
        <div>
          Comments:<br />
          {comments.map((comment, key) => (
            <div key={comment.id}>
              <p>{key + 1} - by {userTrackMatch(comment.userId, users)}<br />{comment.content}</p>
              <br />
            </div> 
          )
          )}
          {comments.length === 0 && <p>No comments yet - After purchasing this track you will be able to leave comments about it!</p>}
        </div>
        <br />
        <div>Price: {track.formattedPrice}</div>
        <br />
        <div>
        {session && <Button variant='info' size='md' onClick={addToCart}>
            Add to Cart
          </Button>}
        {!session && <p>Please <Link href='/login'>login</Link> to add this track to your cart</p>}
        </div>
        <hr />
        <div>
          <Link href={'/catalogue'}>
            <a>Back to the Catalogue</a>
          </Link>
        </div>
      </Container>
    </>
  )
}

export default SingleTrack