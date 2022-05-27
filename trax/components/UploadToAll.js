import React, { useState } from 'react'
import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid' // For creating the unique ID for each track

// Formik imports
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import TextError from '../components/TextError'

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

// Formik Setup
const initialValues = {
  title: '',
  composer: '',
  file: ''
}
const validationSchema = Yup.object({
  title: Yup.string().required('Required!'),
  composer: Yup.string().required('Required!')
})

const UploadToAll = () => {
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [newFileName, setNewFileName] = useState('')

  const onSubmit = (values) => {
    console.log('here are the values from the form', values)
  }

  const handleFileInput = e => {
    setSelectedFile(e.target.files[0])
  }

  const saveTrack = async track => {
    console.log('saveTrack file is ', track)
  
    const response = await fetch('/api/tracks', {
      method: 'POST',
      body: JSON.stringify(track),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  
    console.log('response', track)
    return await response.json()
  }


  const UploadFileS3 = file => {
    // console.log('file coming into the UploadFileS3 function is ====> ', file)

    var fileExtension = file.name.split('.').pop()
    setNewFileName(`${uuidv4()}.${fileExtension}`)

    // console.log('file coming into the UploadFileS3 function is ====> ', newFileName)

    // const params = {
    //   ACL: 'public-read',
    //   Body: file,
    //   Bucket: S3_BUCKET,
    //   Key: newFileName 
    // }

    // myBucket
    //   .putObject(params)
    //   .on('httpUploadProgress', evt => {
    //     setProgress(Math.round((evt.loaded / evt.total) * 100))
    //   })
    //   .send(err => {
    //     if (err) console.log(err)
    //   })
  }

  return (
    <>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        encType='multipart/form-data'
      >
        <Form>
          <div className='form-control'>
            <label htmlFor='title'>Title:</label>
            <Field type='text' id='title' name='title' placeholder='Title' />
            <ErrorMessage name='title' component={TextError} />
          </div>

          <div className='form-control'>
            <label htmlFor='composer'>Composer:</label>
            <Field
              type='text'
              id='composer'
              name='composer'
              placeholder='Composer'
            />
            <ErrorMessage name='title' component={TextError} />
          </div>

          <div className='form-control'>
            <label htmlFor='file'>Upload</label>
            <Field
              type='file'
              id='track'
              name='track'
              placeholder='Track'
              onChange={handleFileInput}
              accept='audio/*' // Points browser to audio files
            />
            <ErrorMessage name='file' component={TextError} />
          </div>

          <button type='submit' onClick={() => UploadFileS3(selectedFile)}>
            Upload Track
          </button>
          <div>Upload Progress is {progress}%</div>
        </Form>
      </Formik>
    </>
  )
}

export default UploadToAll
