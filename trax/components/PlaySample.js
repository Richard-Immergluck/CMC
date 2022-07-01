import React from 'react'
import GetSignedS3URL from './GetSignedS3URL'

const PlaySample = (props) => {

  const { track, start, stop } = props
  //Create presigned URL
  const url = GetSignedS3URL({
    bucket: 'backingtrackstorage',
    key: `${track.fileName}`,
    expires: 600,
  })

  // concat presignedurl with playback range
  const revisedURL=`${url}#t=${start},${stop}`
  console.log(revisedURL)

  return (
    <div>
      <audio controls preload='auto'>
        <source src={revisedURL} type='audio/mp3' />
      </audio>
    </div>
  )
}

export default PlaySample
