import React, { useEffect, useState } from 'react'
import dynamic from "next/dynamic"; // needed for 'Self is not defined' error

// dynamically import WaveSurfer to avoid 'Self is not defined' error
const WaveFormRegionHidden = dynamic(() => import("../components/WaveFormRegionHidden"), { ssr: false }); // needed for 'Self is not defined' error

const PlaySample = props => {
  // destructure props
  const { track } = props
  const [url, setUrl] = useState('')

  useEffect(() => {
    const fetchUrl = async () => {
      const response = await fetch(`/api/tracks/${track.id}/signed-url?mode=sample`)
      const data = await response.json()

      if (response.ok) {
        setUrl(data.url)
      }
    }

    fetchUrl()
  }, [track.id])

  // Render the JSX
  return (
    <div key={track.id}>
      {url && <WaveFormRegionHidden url={url} track={track} />}
    </div>
  )
}

export default (PlaySample)
