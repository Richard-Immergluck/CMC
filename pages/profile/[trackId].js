import React, { useEffect, useState } from 'react'
import { getSession, useSession } from 'next-auth/react'
import prisma from '../../components/prisma'
import Link from 'next/link'
import dynamic from 'next/dynamic' // needed for 'Self is not defined' error
import { Container } from 'react-bootstrap'
import _ from 'lodash'
import CommentBox from '../../components/CommentBox'
import { canAccessFullTrack, getCurrentUser } from '../../lib/server/ownership'

export const getServerSideProps = async context => {
  const session = await getSession({ req: context.req })
  const currentUser = await getCurrentUser(session)

  if (!currentUser) {
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false
      }
    }
  }

  const trackId = context.params.trackId.split('-')[0]

  // Grab the track from DB using the params
  const track = await prisma.track.findUnique({
    where: {
      id: Number(trackId)
    }
  })

  if (!track) {
    return {
      notFound: true
    }
  }

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

  // Pull all users for the userTrackMatch function
  const users = await prisma.user.findMany()

  const { allowed } = await canAccessFullTrack({
    userId: currentUser.id,
    trackId
  })

  // Return the track and comments to the page conditionally
  if (allowed) {
    return {
      props: {
        track,
        comments,
        users
      }
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
  const { track, comments, users } = params
  const [fullTrackUrl, setFullTrackUrl] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')

  // Get the current user session
  const { data: session } = useSession()

  // needed for WaveForm 'Self is not defined' error
  const WaveFormFull = dynamic(() => import('../../components/WaveFormFull'), {
    ssr: false
  })

  useEffect(() => {
    const fetchUrls = async () => {
      const [fullResponse, downloadResponse] = await Promise.all([
        fetch(`/api/tracks/${track.id}/signed-url?mode=full`),
        fetch(`/api/tracks/${track.id}/signed-url?mode=download`)
      ])

      const [fullData, downloadData] = await Promise.all([
        fullResponse.json(),
        downloadResponse.json()
      ])

      if (fullResponse.ok) {
        setFullTrackUrl(fullData.url)
      }

      if (downloadResponse.ok) {
        setDownloadUrl(downloadData.url)
      }
    }

    fetchUrls()
  }, [track.id])

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

          {fullTrackUrl && <WaveFormFull url={fullTrackUrl} />}
          <br />
          <br />
          <a
            className='btn btn-info active'
            rel='noreferrer'
            target='_blank'
            download={track.downloadName}
            role='button'
            href={downloadUrl || '#'}
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
          <CommentBox trackId={track.id} />
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
