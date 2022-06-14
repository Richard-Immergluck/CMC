import React from 'react'
import prisma from '/components/prisma'
import Link from 'next/link'
import SecureS3Download from '../../components/SecureS3Upload'


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
  
  const downloadFile = () => {
    SecureS3Download(track.filename)
  }

  return (
    <>
      <h2>Track details for {track.title}</h2>
      <p>File name is {track.fileName}</p>
      <p>Title is {track.title}</p>
      <p>Composer is {track.composer}</p>
      <button onClick={downloadFile(track.filename)}>Download</button>
      <div>
        <Link href={'/catalogue'}>
          <a>Back to the Catalogue</a>
        </Link>
      </div>
    </>
  )
}

export default SingleTrack
