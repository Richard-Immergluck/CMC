import React from 'react'
import GetSignedS3URL from './GETSignedS3URL'
import dynamic from "next/dynamic"; // needed for 'Self is not defined' error

const PlayTrack = props => {
  const WaveForm = dynamic(() => import("./WaveForm"), { ssr: false }); // needed for 'Self is not defined' error
  const { track } = props

  //Create presigned URL
  const url = GetSignedS3URL({
    bucket: process.env.S3_BUCKET_NAME,
    key: `${track.fileName}`,
    expires: 600
  })

  // Render the JSX
  return (
    <div key={track.id}>
      <WaveForm url={url} />
    </div>
  )
}

export default PlayTrack
