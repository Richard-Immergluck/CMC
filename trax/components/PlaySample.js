import React from 'react'
import GetSignedS3URL from './GETSignedS3URL'
import dynamic from "next/dynamic"; // needed for 'Self is not defined' error

const PlaySample = props => {
  // destructure props
  const { track } = props

  // dynamically import WaveSurfer to avoid 'Self is not defined' error
  const WaveFormRegionHidden = dynamic(() => import("../components/WaveFormRegionHidden"), { ssr: false }); // needed for 'Self is not defined' error


  //Create presigned URL
  const url = GetSignedS3URL({
    bucket: process.env.S3_BUCKET_NAME,
    key: `${track.fileName}`,
    expires: 5
  })

  // Concatonate the presignedurl to include the playback region
  const revisedURL = `${url}#t=${track.previewStart},${track.previewEnd}`

  // Render the JSX
  return (
    <div key={track.id}>
      <WaveFormRegionHidden url={revisedURL} track={track} />
    </div>
  )
}

export default (PlaySample)
