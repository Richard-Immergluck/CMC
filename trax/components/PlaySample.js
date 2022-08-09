import React, { memo } from 'react'
import GetSignedS3URL from './GETSignedS3URL'
import dynamic from "next/dynamic"; // needed for 'Self is not defined' error

const PlaySample = props => {
  const WaveFormRegionHidden = dynamic(() => import("../components/WaveFormRegionHidden"), { ssr: false }); // needed for 'Self is not defined' error
  const { track, start, stop } = props

  //Create presigned URL
  const url = GetSignedS3URL({
    bucket: process.env.S3_BUCKET_NAME,
    key: `${track.fileName}`,
    expires: 600
  })

  // Concat presignedurl with playback range
  const revisedURL = `${url}#t=${start},${stop}`

  // Render the JSX
  return (
    <div key={track.id}>
      <WaveFormRegionHidden url={revisedURL} />
    </div>
  )
}

export default memo(PlaySample)
