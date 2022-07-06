import React from 'react'
import prisma from '/components/prisma'
import Link from 'next/link'
import GETSignedS3URL from '../../components/GETSignedS3URL'
import dynamic from "next/dynamic"; // needed for 'Self is not defined' error

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
      composer: true
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
  const WaveFormRegion = dynamic(() => import("../../components/WaveFormRegion"), { ssr: false }); // needed for 'Self is not defined' error
  
  // Generate the presigned url
  const url = GETSignedS3URL({
    bucket: 'backingtrackstorage',
    key: `${track.fileName}`,
    expires: 60
  })

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
      <div>
      <button>Click here to add to basket</button>
      </div>
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
