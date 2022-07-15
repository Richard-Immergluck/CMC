import React from 'react'
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
    },
    select: {
      id: true,
      fileName: true,
      title: true,
      composer: true,
      previewStart: true,
      previewEnd: true,
      price: true,
      formattedPrice: true,
      userId: true
    }
  })

  const users = await prisma.user.findMany()

  return {
    props: {
      track,
      users
    }
  }
}



const SingleTrack = ({ track, users }) => {

  console.log(track.userId)

  // needed for 'Self is not defined' error
  const WaveFormRegion = dynamic(
    () => import('../../components/WaveFormRegion'),
    { ssr: false }
  )

  // Generate the presigned url
  const url = GETSignedS3URL({
    bucket: 'backingtrackstorage',
    key: `${track.fileName}`,
    expires: 60
  })

  // Instantiate useCart hook
  const { addItem } = useCart()

  // Add track to the cart function
  const addToCart = () => {
    addItem({ ...track })
    alert('Track added to cart!')
  }

  const userTrackMatch = (userId, users) => {

    const user = _.find(users, { id: userId })
    return user ? user.name : 'Unknown'
  }

  // Render the JSX
  return (
    <>
      <Container className='mt-5'>
        <h2>{track.title}</h2>
        <p>by {track.composer}</p>
        <p>Uploaded by {userTrackMatch(track.userId, users)}</p>
      
        <br />

        <WaveFormRegion url={url} />
        <br />
        <br />
        <br />
        <div>Price: {track.formattedPrice}</div>
        <div>
          <Button variant='info' size='md' onClick={addToCart}>Add to Cart</Button>
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
