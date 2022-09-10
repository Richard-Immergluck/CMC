// Some of the code used on this page is taken directly from the WaveSurfer.js documentation
// https://wavesurfer-js.org/docs.html
// See WaveFormRegion.js for general comments

import React, { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import Button from 'react-bootstrap/Button'

const WaveForm = ( props ) => {
  const { url, track } = props

  const containerRef = useRef()
  const waveSurferRef = useRef({
    isPlaying: () => false
  })

  const [buttonDisable, setButtonDisable] = useState(true)
  const [play, setPlay] = useState(false)

  useEffect(() => {
    const waveSurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#8D86C9',
      progressColor: '#242038',
      normalize: true,
      preload: 'auto',
      hideScrollbar: true,
      pixelRatio: 1,
      barWidth: 1.5,
      interact: false, // Set to false to disable mouse/touch interaction
    })

    waveSurfer.load(url)

    waveSurfer.on('ready', () => {
      waveSurferRef.current = waveSurfer
      setButtonDisable(false)
    })

    return () => {
      waveSurfer.destroy()
    }
  }, [url])

  const togglePlayPause = () => {
    if (waveSurferRef.current.isPlaying()) {
      waveSurferRef.current.pause()
    } else {
      waveSurferRef.current.play(track.previewStart, track.previewEnd) // Play the track from the preview start to the preview end
    }
    setPlay(!play)
  }

  return (
    <>
      <div ref={containerRef} hidden /> {/* The waveform itself is hidden */}
      <Button className=''
        size='sm'
        variant='info'
        onClick={togglePlayPause}
        disabled={buttonDisable}
      >
        {play ? 'pause' : 'Play Sample'}
      </Button>
    </>
  )
}

export default WaveForm
