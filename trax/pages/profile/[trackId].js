import React, { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import prisma from '/components/prisma'
import Link from 'next/link'
import GETSignedS3URL from '../../components/GETSignedS3URL'
import dynamic from 'next/dynamic' // needed for 'Self is not defined' error
import { Container } from 'react-bootstrap'
import _ from 'lodash'
import CommentBox from '../../components/CommentBox'

// Create dynamic routes
export const getStaticPaths = async () => {
  // Get all the tracks from the DB
  const allTracks = await prisma.track.findMany({
    orderBy: {
      downloadCount: 'desc'
    },
    take: 100
  })

  const paths = allTracks.map(track => {
    return {
      params: {
        trackId: `${track.id}`,
        userId: `${track.userId}`
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
  // Get the full url from the context
  const { ...slug } = context.params

  // Split the url to get the user id and track id
  const trackId = slug.trackId.split('-')[0]
  const userId = slug.trackId.split('-').pop()

  // Get the user from the database
  const currentUser = await prisma.user.findUnique({
    where: {
      id: userId
    }
  })

  // Grab the track from DB using the params
  const track = await prisma.track.findUnique({
    where: {
      id: Number(trackId)
    }
  })

  // Retrieve the comments from DB
  const comments = await prisma.comment.findMany({
    where: {
      track: {
        id: Number(trackId)
      }
    }
  })

  // Convert the date element of each comment to a locale date string
  comments.map(comment => {
    return (comment.createdAt = comment.createdAt.toLocaleDateString())
  })

  // Convert the date element of the track to a locale date string
  track.uploadedAt = track.uploadedAt.toLocaleDateString()

  // Check if the track has been purchased by the current user
  const isTrackOwnerQuery = await prisma.TrackOwner.findMany({
    where: {
      userId: currentUser.id
    }
  })

  // create boolean to check if the track has been purchased
  const isTrackOwner = isTrackOwnerQuery.length > 0

  // Check if the track was uploaded by the current user
  const isTrackUploader = track.userId === currentUser.id

  // console.log('Are you the track owner?', isTrackOwner)
  // console.log('Are you the track uploader?', isTrackUploader)

  // Pull all users for the userTrackMatch function
  const users = await prisma.user.findMany()

  // Return the track and comments to the page conditionally
  if (isTrackOwner || isTrackUploader) {
    return {
      props: {
        track,
        comments,
        users,
        userId
      },
      revalidate: 30 // This will revalidate the page every 30 seconds
      // Which will update the comments if a new comment is added
    }
  } else {
    // If conditions not met, show 404 page
    return {
      redirect: {
        destination: '/404',
        permanent: false
      }
    }
  }
}

const TrackOwnerPage = params => {
  // Destructure params
  const { track, comments, users, userId } = params

  // Get the current user session
  const { data: session } = useSession()

  // needed for WaveForm 'Self is not defined' error
  const WaveFormFull = dynamic(() => import('../../components/WaveFormFull'), {
    ssr: false
  })

  // Generate the presigned url
  const url = GETSignedS3URL({
    bucket: process.env.S3_BUCKET_NAME,
    key: `${track.fileName}`,
    expires: 60
  })

  // Function to match the user's name with the track
  const userTrackMatch = (userId, users) => {
    const user = _.find(users, { id: userId })
    return user ? user.name : 'Unknown'
  }

  return (
    <>
      {session && (
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
            Additional Information:
            <br />
            {track.additionalInfo}
          </p>

          <br />

          <WaveFormFull url={url} />
          <br />
          <br />
          <a
            className='btn btn-info active'
            rel='noreferrer'
            target='_blank'
            download={track.downloadName}
            role='button'
            href={GETSignedS3URL({
              bucket: 'backingtrackstorage',
              key: `${track.fileName}`,
              expires: 900
            })}
          >
            Download
          </a>
          <br />
          <br />
          <div>
            Comments:
            <br />
            {comments.map((comment, key) => (
              <div key={comment.id}>
                <p>
                  {key + 1} - by {userTrackMatch(comment.userId, users)}
                  <br />
                  {comment.content}
                </p>
                <br />
              </div>
            ))}
            {comments.length === 0 && (
              <p>
                No comments yet - After purchasing this track you will be able
                to leave comments about it!
              </p>
            )}
          </div>
          <hr />
          <br />
          <CommentBox trackId={track.id} user={userId} />
          <hr />
          <div>
            <Link href={'/catalogue'}>
              <a>Back to the Catalogue</a>
            </Link>
          </div>
        </Container>
      )}
    </>
  )
}

export default TrackOwnerPage
