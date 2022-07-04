import React from 'react'
import GetSignedS3URL from './GetSignedS3URL'

const PlaySample = props => {
  const { track, start, stop } = props

  //Create presigned URL
  const url = GetSignedS3URL({
    bucket: 'backingtrackstorage',
    key: `${track.fileName}`,
    expires: 600
  })

  // Concat presignedurl with playback range
  const revisedURL = `${url}#t=${start},${stop}`

  // Render the JSX
  return (
    <div key={track.id}>
      <audio controls preload='metadata'>
        <source src={revisedURL} type='audio/mp3' />
        <source src={revisedURL} type='audio/wav' />
        <p>Your browser does not support this file type.</p>
      </audio>
    </div>
  )
}

export default PlaySample
