// Some of the code used on this page is taken directly from the WaveSurfer.js documentation
// https://wavesurfer-js.org/docs.html

import React, { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import Button from 'react-bootstrap/Button'


const WaveForm = ( props ) => {
  // Destructure the props
  const { url, track } = props

  // Create refs for the waveform and container
  const containerRef = useRef()
  const waveSurferRef = useRef({
    isPlaying: () => false
  })

  // Create states for the play button
  const [buttonDisable, setButtonDisable] = useState(true)
  const [play, setPlay] = useState(false)

  // Instantiate the wavesurfer object
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
      interact: false
    })

    // Load the track url into the wavesurfer object
    waveSurfer.load(url)

    // Subscribe to the wavesurfer ready event and activate the play button
    // This is to stop the play button being activated before the track has loaded
    waveSurfer.on('ready', () => {
      waveSurferRef.current = waveSurfer
      setButtonDisable(false)
    })

    // Subscribe to the wavesurfer finish
    return () => {
      waveSurfer.destroy()
    }
  }, [url])

  // Toggle function for the play button
  const togglePlayPause = () => {
    if (waveSurferRef.current.isPlaying()) {
      waveSurferRef.current.pause()
    } else {
      waveSurferRef.current.play(track.previewStart, track.previewEnd) // Play the track from the preview start to the preview end
    }
    setPlay(!play)
  }

  // Render the waveform and play button
  return (
    <>
      <div ref={containerRef} />
      <Button className='mt-3'
        size='md'
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
