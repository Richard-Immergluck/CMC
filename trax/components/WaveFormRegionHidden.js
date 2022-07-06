import React, { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'

const WaveForm = ({ url }) => {
  const previewStart = 15
  const previewEnd = 30

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
      interact: false,
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
      waveSurferRef.current.play(previewStart, previewEnd)
    }
    setPlay(!play)
  }

  return (
    <>
      <div ref={containerRef} hidden />
      <button m='4' onClick={togglePlayPause} disabled={buttonDisable}>
        {play ? 'pause' : 'Play Sample'}
      </button>
    </>
  )
}

export default WaveForm
