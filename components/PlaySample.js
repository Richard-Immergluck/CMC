import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from './ui/primitives'

const PlaySample = props => {
  const { active, onActivate, onDeactivate, track } = props
  const audioRef = useRef(null)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const previewStart = Number.isFinite(track.previewStart) ? track.previewStart : 0
  const previewEnd = Number.isFinite(track.previewEnd) && track.previewEnd > previewStart
    ? track.previewEnd
    : null

  const clampToPreviewRange = useCallback(audio => {
    if (audio.currentTime < previewStart || (previewEnd && audio.currentTime >= previewEnd)) {
      audio.currentTime = previewStart
    }
  }, [previewEnd, previewStart])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio || !url) {
      return undefined
    }

    if (!active) {
      audio.pause()
      return undefined
    }

    clampToPreviewRange(audio)
    audio.play().catch(() => {
      setError('Preview unavailable')
      onDeactivate()
    })

    return undefined
  }, [active, clampToPreviewRange, onDeactivate, url])

  useEffect(() => () => {
    audioRef.current?.pause()
  }, [])

  const fetchPreviewUrl = async () => {
    if (url) {
      return url
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/tracks/${track.id}/signed-url?mode=sample`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Preview unavailable')
      }

      setUrl(data.url)
      return data.url
    } catch (previewError) {
      setError(previewError.message)
      onDeactivate()
      return ''
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewClick = async () => {
    if (active) {
      onDeactivate()
      return
    }

    onActivate()
    await fetchPreviewUrl()
  }

  const handleLoadedMetadata = event => {
    event.currentTarget.currentTime = previewStart
  }

  const handleSeeking = event => {
    clampToPreviewRange(event.currentTarget)
  }

  const handleTimeUpdate = event => {
    if (previewEnd && event.currentTarget.currentTime >= previewEnd) {
      event.currentTarget.pause()
      event.currentTarget.currentTime = previewStart
      onDeactivate()
    }
  }

  const buttonLabel = loading
    ? 'Loading Preview'
    : active
      ? 'Pause Preview'
      : error || 'Preview'

  return (
    <>
      <Button
        aria-pressed={active}
        disabled={loading}
        onClick={handlePreviewClick}
        size='sm'
        variant={active ? 'secondary' : 'subtle'}
      >
        {buttonLabel}
      </Button>
      {url && (
        <audio
          ref={audioRef}
          className='cmc-audio-preview-source'
          onEnded={onDeactivate}
          onLoadedMetadata={handleLoadedMetadata}
          onSeeking={handleSeeking}
          onTimeUpdate={handleTimeUpdate}
          preload='metadata'
          src={url}
        />
      )}
    </>
  )
}

export default PlaySample
