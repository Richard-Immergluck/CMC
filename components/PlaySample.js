import React, { useEffect, useState } from 'react'

const PlaySample = props => {
  const { track } = props
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const previewStart = Number.isFinite(track.previewStart) ? track.previewStart : 0
  const previewEnd = Number.isFinite(track.previewEnd) && track.previewEnd > previewStart
    ? track.previewEnd
    : null

  useEffect(() => {
    let isMounted = true

    const fetchUrl = async () => {
      setError('')
      setUrl('')

      try {
        const response = await fetch(`/api/tracks/${track.id}/signed-url?mode=sample`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Preview unavailable')
        }

        if (isMounted) {
          setUrl(data.url)
        }
      } catch (previewError) {
        if (isMounted) {
          setError(previewError.message)
        }
      }
    }

    fetchUrl()

    return () => {
      isMounted = false
    }
  }, [track.id])

  const handleLoadedMetadata = event => {
    if (previewStart > 0) {
      event.currentTarget.currentTime = previewStart
    }
  }

  const clampToPreviewRange = audio => {
    if (audio.currentTime < previewStart || (previewEnd && audio.currentTime >= previewEnd)) {
      audio.currentTime = previewStart
    }
  }

  const handlePlay = event => {
    clampToPreviewRange(event.currentTarget)
  }

  const handleSeeking = event => {
    clampToPreviewRange(event.currentTarget)
  }

  const handleTimeUpdate = event => {
    if (previewEnd && event.currentTarget.currentTime >= previewEnd) {
      event.currentTarget.pause()
      event.currentTarget.currentTime = previewStart
    }
  }

  if (error) {
    return <p className='cmc-audio-preview-status'>{error}</p>
  }

  if (!url) {
    return <p className='cmc-audio-preview-status'>Preparing preview...</p>
  }

  return (
    <audio
      className='cmc-audio-preview'
      controls
      controlsList='nodownload'
      onLoadedMetadata={handleLoadedMetadata}
      onPlay={handlePlay}
      onSeeking={handleSeeking}
      onTimeUpdate={handleTimeUpdate}
      preload='metadata'
      src={url}
    >
      Your browser does not support audio playback.
    </audio>
  )
}

export default PlaySample
