import React from 'react'
import prisma from '/components/prisma'
import Link from 'next/link'
import GETSignedS3URL from '../../components/GETSignedS3URL'
import dynamic from 'next/dynamic' // needed for 'Self is not defined' error
import { useCart } from 'react-use-cart'

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
      formattedPrice: true
    }
  })

  return {
    props: {
      track: track
    }
  }
}

// Render the JSX
const SingleTrack = ({ track }) => {
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

  return (
    <>
      <h2>Track details for {track.title}</h2>
      <p>File name is {track.fileName}</p>
      <p>Title is {track.title}</p>
      <p>Composer is {track.composer}</p>
      <a href={url} download>
        {' '}
        Click here to download!{' '}
      </a>
      <br />
      <br />
      <div>This track is {track.formattedPrice}</div>
      <div>
        <button onClick={addToCart}>Add to Cart</button>
      </div>
      <br />
      <br />
      <WaveFormRegion url={url} />
      <hr />
      <div>
        <Link href={'/catalogue'}>
          <a>Back to the Catalogue</a>
        </Link>
      </div>
    </>
  )
}

export default SingleTrack
