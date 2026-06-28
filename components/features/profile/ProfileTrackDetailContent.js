'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Container } from 'react-bootstrap'
import CommentBox from '../../CommentBox'

const WaveFormFull = dynamic(() => import('../../WaveFormFull'), {
  ssr: false
})

const ProfileTrackDetailContent = ({ track, comments }) => {
  const [fullTrackUrl, setFullTrackUrl] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')

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

  return (
    <Container className='bg-light border mt-5 p-3'>
      <h2>{track.title}</h2>
      <p>by {track.composer}</p>
      <p>
        Uploaded by {track.uploaderName} on {track.uploadedAt}
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
              {key + 1} - by {comment.userName}
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
        <Link href='/catalogue'>Back to the Catalogue</Link>
      </div>
    </Container>
  )
}

export default ProfileTrackDetailContent
