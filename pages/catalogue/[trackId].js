import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import dynamic from 'next/dynamic' // needed for 'Self is not defined' error
import { useCart } from 'react-use-cart'
import { Button } from 'react-bootstrap'
import _ from 'lodash'
import prisma from '../../lib/server/prisma'
import { publicTrackWhere } from '../../lib/server/tracks-core.mjs'

// Dynamically import WaveSurfer to avoid 'Self is not defined' error
const WaveFormRegion = dynamic(
  () => import('../../components/WaveFormRegion'),
  { ssr: false }
)

const parseTrackIdParam = value => {
  const trackId = Number(value)
  return Number.isInteger(trackId) && trackId > 0 ? trackId : null
}

// Fetch data for the page
export const getServerSideProps = async context => {
  // Destructure the trackId from the context
  const { params } = context
  const trackId = parseTrackIdParam(params.trackId)

  if (!trackId) {
    return {
      notFound: true
    }
  }

  // Retrieve the individual track from DB
  const track = await prisma.track.findFirst({
    where: {
      id: trackId,
      ...publicTrackWhere
    }
  })

  if (!track) {
    return {
      notFound: true
    }
  }

  // Convert the track date object to a locale date string
  track.uploadedAt = track.uploadedAt.toLocaleDateString()

  // Retrieve the users from DB to match user with track
  const users = await prisma.user.findMany()

  // Retrieve the comments from DB
  const comments = await prisma.comment.findMany({
    where: {
      track: {
        id: trackId
      },
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
  const router = useRouter()

  const [url, setUrl] = useState('')

  // Get the session
  const { data: session} = useSession()

  useEffect(() => {
    const fetchUrl = async () => {
      const response = await fetch(`/api/tracks/${track.id}/signed-url?mode=sample`)
      const data = await response.json()

      if (response.ok) {
        setUrl(data.url)
      }
    }

    fetchUrl()
  }, [track.id])

  // Instantiate useCart hook
  const { addItem } = useCart()

  // Add track to the cart
  const addToCart = () => {
    addItem({ ...track })
    alert('Track added to cart!')
  }

  const goBack = () => {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push('/catalogue')
  }

  // Function to return the user name
  const userTrackMatch = (userId, users) => {
    const user = _.find(users, { id: userId })
    return user ? user.name : 'Unknown'
  }

  const metadata = [
    ['Key', track.key],
    ['Instrumentation', track.instrumentation],
    ['Uploaded by', userTrackMatch(track.userId, users)],
    ['Uploaded', track.uploadedAt]
  ].filter(([, value]) => value)

  // Render the JSX
  return (
    <main className='cmc-track-page'>
      <div className='container'>
        <Button variant='outline-secondary' size='sm' onClick={goBack} className='cmc-track-back-button'>
          Back
        </Button>

        <section className='cmc-track-hero'>
          <div>
            <p className='cmc-kicker'>Catalogue detail</p>
            <h1>{track.title}</h1>
            <p className='cmc-track-composer'>by {track.composer}</p>
          </div>

          <aside className='cmc-track-purchase-panel' aria-label='Purchase track'>
            <span>Price</span>
            <strong>{track.formattedPrice || 'Price unavailable'}</strong>
            {session && (
              <Button variant='info' size='md' onClick={addToCart}>
                Add to Cart
              </Button>
            )}
            {!session && (
              <p>
                Please <Link href='/login'>login</Link> to add this track to your cart.
              </p>
            )}
          </aside>
        </section>

        <section className='cmc-track-layout'>
          <article className='cmc-track-main-panel'>
            <div className='cmc-track-section-header'>
              <h2>Preview</h2>
              <p>Listen to the approved sample before adding this track to your cart.</p>
            </div>
            <div className='cmc-track-waveform'>
              {url ? (
                <WaveFormRegion url={url} track={track} />
              ) : (
                <p>Preparing preview...</p>
              )}
            </div>
          </article>

          <aside className='cmc-track-meta-panel'>
            <h2>Track Details</h2>
            <dl className='cmc-track-meta-list'>
              {metadata.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </section>

        <section className='cmc-track-info-grid'>
          <article className='cmc-track-main-panel'>
            <div className='cmc-track-section-header'>
              <h2>Additional Information</h2>
            </div>
            <p className='cmc-track-notes'>
              {track.additionalInfo || 'No additional information has been supplied for this track.'}
            </p>
          </article>

          <article className='cmc-track-main-panel'>
            <div className='cmc-track-section-header'>
              <h2>Comments</h2>
              <p>Purchasers can leave notes and performance feedback here.</p>
            </div>
            <div className='cmc-track-comments'>
              {comments.map((comment, key) => (
                <div className='cmc-track-comment' key={comment.id}>
                  <span>{key + 1}</span>
                  <p>{comment.content}</p>
                  <small>by {userTrackMatch(comment.userId, users)}</small>
                </div>
              ))}
              {comments.length === 0 && (
                <p className='cmc-track-empty'>
                  No comments yet. After purchasing this track you will be able to leave comments about it.
                </p>
              )}
            </div>
          </article>
        </section>

        <Link href='/catalogue' className='cmc-track-catalogue-link'>
          Back to the Catalogue
        </Link>
      </div>
    </main>
  )
}

export default SingleTrack
