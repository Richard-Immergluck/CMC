import React from 'react'
import PUTSignedS3URL from '/components/PutSignedS3URL'

function testPreviewUpload() {

  const filename = 'test.mp3'

  PUTSignedS3URL(filename)

  return (
    <div>testPreviewUpload</div>
  )
}

export default testPreviewUpload