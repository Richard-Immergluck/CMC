import React, { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { Button } from 'react-bootstrap'

const WaveForm = ({ url }) => {
  const containerRef = useRef()
  const waveSurferRef = useRef({
    isPlaying: () => false
  })
  const [play, setPlay] = useState(false)

  useEffect(() => {
    const waveSurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#8D86C9',
      progressColor: '#242038',
      normalize: true,
      preload: 'auto',
      height: 50
    })
    waveSurfer.load(url)
    waveSurfer.on('ready', () => {
      waveSurferRef.current = waveSurfer
    })

    return () => {
      waveSurfer.destroy()
    }
  }, [url])

  const handlePlayPause = () => {
    if (waveSurferRef.current.isPlaying()) {
      waveSurferRef.current.pause()
    } else {
      waveSurferRef.current.play()
    }
    setPlay(!play)
  }

  return (
    <>
    <div className='d-grid gap-2'>
      <div ref={containerRef} hidden/>
      <Button variant='info' size="sm" onClick={handlePlayPause} className="">
        {play ? 'pause' : 'play'}
      </Button>
      </div>
    </>
  )
}

export default WaveForm
