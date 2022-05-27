// Imports
import React, { useState } from 'react'
import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid' // For creating the unique ID for each track

const S3_BUCKET = 'backingtrackstorage'
const REGION = 'eu-west-2'

AWS.config.update({
  accessKeyId: 'AKIAV66ZZX5G234R6BXM',
  secretAccessKey: '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'
})

const myBucket = new AWS.S3({
  params: { Bucket: S3_BUCKET },
  region: REGION
})

const UploadTrack = (props) => {
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)

  const handleFileInput = e => {
    setSelectedFile(e.target.files[0])
  }

  const uploadFileS3 = file => {
      
    var fileName = file.name
    var fileExtension = (fileName).split('.').pop()
    var newFileName = `${uuidv4()}.${fileExtension}`

    const params = {
      ACL: 'public-read',
      Body: file,
      Bucket: S3_BUCKET,
      Key: newFileName // this is where the DB generated file name should go
    }

    myBucket
      .putObject(params)
      .on('httpUploadProgress', evt => {
        setProgress(Math.round((evt.loaded / evt.total) * 100))
      })
      .send(err => {
        if (err) console.log(err)
      })
  }

  return (
    <>
      <p></p>
      <div>
        <input type='file' onChange={handleFileInput} />
        <button onClick={() => uploadFileS3(selectedFile)}>Upload to S3</button>
        <div>Upload Progress is {progress}%</div>
      </div>
      <p></p>
    </>
  )
}

export default UploadTrack
