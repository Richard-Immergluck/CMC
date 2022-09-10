// Some of the code used on this page is taken directly from the WaveSurfer.js documentation
// https://wavesurfer-js.org/docs.html
// See WaveFormRegion.js for general comments

import React, { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { Button } from 'react-bootstrap'

const WaveForm = ({ url }) => {
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
      height: 100,
      hideScrollbar: true,
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
      waveSurferRef.current.play()
    }
    setPlay(!play)
  }

  return (
    <>
      <div ref={containerRef} />
      <Button className='mt-3'
        size='md'
        variant='info'
        onClick={togglePlayPause}
        disabled={buttonDisable}
      >
        {play ? 'pause' : 'Play'}
      </Button>
    </>
  )
}

export default WaveForm
