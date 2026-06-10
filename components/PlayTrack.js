import React, { useEffect, useState } from 'react'
import dynamic from "next/dynamic"; // needed for 'Self is not defined' error

const WaveForm = dynamic(() => import("./WaveFormFullRegionHidden"), { ssr: false }); // needed for 'Self is not defined' error

const PlayTrack = props => {
  const { track } = props
  const [url, setUrl] = useState('')

  useEffect(() => {
    const fetchUrl = async () => {
      const response = await fetch(`/api/tracks/${track.id}/signed-url?mode=full`)
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
      {url && <WaveForm url={url} />}
    </div>
  )
}

export default PlayTrack
