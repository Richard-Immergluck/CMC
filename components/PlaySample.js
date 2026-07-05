import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from './ui/primitives'

const normalizeVolume = volume => Math.min(1, Math.max(0, Number.isFinite(volume) ? volume : 1))

const PlaySample = props => {
  const {
    active,
    mode = 'sample',
    onActivate,
    onDeactivate,
    onProgress,
    seekCommand,
    track,
    volume = 1
  } = props
  const audioRef = useRef(null)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isFullPlayback = mode === 'full'
  const previewStart = Number.isFinite(track.previewStart) ? track.previewStart : 0
  const previewEnd = Number.isFinite(track.previewEnd) && track.previewEnd > previewStart
    ? track.previewEnd
    : null

  const clampToPreviewRange = useCallback(audio => {
    if (isFullPlayback) {
      return
    }

    if (audio.currentTime < previewStart || (previewEnd && audio.currentTime >= previewEnd)) {
      audio.currentTime = previewStart
    }
  }, [isFullPlayback, previewEnd, previewStart])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = normalizeVolume(volume)
    }
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio || !seekCommand || !Number.isFinite(seekCommand.time)) {
      return
    }

    audio.currentTime = isFullPlayback
      ? Math.max(0, seekCommand.time)
      : Math.max(previewStart, previewEnd ? Math.min(previewEnd, seekCommand.time) : seekCommand.time)
  }, [isFullPlayback, previewEnd, previewStart, seekCommand, url])

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
    audio.volume = normalizeVolume(volume)
    audio.play().catch(() => {
      setError('Preview unavailable')
      onDeactivate()
    })

    return undefined
  }, [active, clampToPreviewRange, onDeactivate, url, volume])

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
      const response = await fetch(`/api/tracks/${track.id}/signed-url?mode=${isFullPlayback ? 'full' : 'sample'}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Preview unavailable')
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
    event.currentTarget.currentTime = seekCommand?.time ?? (isFullPlayback ? 0 : previewStart)
    event.currentTarget.volume = normalizeVolume(volume)
    onProgress?.(event.currentTarget.currentTime)
  }

  const handleSeeking = event => {
    clampToPreviewRange(event.currentTarget)
  }

  const handleTimeUpdate = event => {
    if (!isFullPlayback && previewEnd && event.currentTarget.currentTime >= previewEnd) {
      event.currentTarget.pause()
      event.currentTarget.currentTime = previewStart
      onProgress?.(previewStart)
      onDeactivate()
      return
    }

    onProgress?.(event.currentTarget.currentTime)
  }

  const buttonLabel = loading
    ? isFullPlayback ? 'Loading Track' : 'Loading Preview'
    : error || (isFullPlayback ? 'Play Track' : 'Preview')

  return (
    <>
      <Button
        aria-label={active ? (isFullPlayback ? 'Pause Track' : 'Pause Preview') : undefined}
        aria-pressed={active}
        className={active ? 'cmc-preview-action cmc-provider-action-button cmc-preview-action--active' : 'cmc-preview-action cmc-provider-action-button'}
        disabled={loading}
        onClick={handlePreviewClick}
        size='sm'
        variant='secondary'
      >
        {active ? (
          <span className='cmc-preview-pause-icon' aria-hidden='true'>
            <span />
            <span />
          </span>
        ) : buttonLabel}
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
