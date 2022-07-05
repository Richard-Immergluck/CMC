import React from 'react'
import GETSignedS3URL from './GETSignedS3URL'
// import dynamic from "next/dynamic"; // needed for 'Self is not defined' error

const TestComponent = () => {
  // const WaveForm = dynamic(() => import("./Waveform"), { ssr: false }); // needed for 'Self is not defined' error

  const url = GETSignedS3URL({
    bucket: 'backingtrackstorage',
    key: `71fcc8e9-803a-4e9a-91e6-456bf8b46ec6.mp3`,
    expires: 60
  })

  return (
    <>
      <div>TestComponent</div>
      {/* <WaveForm url={url} /> */}
      <input
        control='fileInput'
        type='file'
        label='File'
        name='file'
        onChange={e => {
          let file = e.target.files[0]
          setUuid(`${uuidv4()}`) // Generate new UUID for file uploads
          setSelectedFile(file)
          console.log('uuid generated -----', uuid)
          console.log('selectedFile generated ===>', file)
        }}
        accept='audio/*' // Points browser to audio files
      />
    </>
  )
}

export default TestComponent
