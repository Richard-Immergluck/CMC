import React, { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'

const WaveForm = ({ url }) => {
  const containerRef = useRef()
  const waveSurferRef = useRef({
    isPlaying: () => false,
  })
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const waveSurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#8D86C9",
      progressColor: "#242038",
      normalize: true,
      preload: "auto",
      hideScrollbar: true,
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
      waveSurferRef.current.pause();
    } else {
      waveSurferRef.current.play();
    }
    setPlay(!play);
  };

  return (
    <>
      <div ref={containerRef} />
      <button m="4" onClick={handlePlayPause}>
          {play ? "pause" : "play"}
        </button>
    </>
  )
}

export default WaveForm
