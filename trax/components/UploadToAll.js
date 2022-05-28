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

const onSubmit = (values, selectedFile, newUUID ,newFileName) => {
  console.log('onSubmit values', values, selectedFile, newUUID, newFileName)
  uploadToDB(values, selectedFile, newFileName)
}

const uploadToDB = async (values, file, newFileName) => {

  // console.log('uploadToDB props are ===> ', values, file, newFileName)

  const valuesToSubmit = { ...values, id: newFileName}

  console.log(valuesToSubmit)


  const response = await fetch('/api/tracks', {
    method: 'POST',
    body: JSON.stringify(valuesToSubmit),
    headers: {
      'Content-Type': 'application/json'
    }
  })

  console.log('response', response)
  return await response.json()
}

const UploadToAll = () => {
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [newFileName, setNewFileName] = useState('')
  const [newUUID, setNewUUID] = useState('')

  const handleFileInput = e => {
    setSelectedFile(e.target.files[0])
    setNewUUID(`${uuidv4()}`)
  }

  const UploadFileS3 = (file) => {
    
    // So this side is uploading the previous UUID not the current one!

    // Extract File Extension
    var fileExtension = file.name.split('.').pop()

    // create new file name with UUID and extension
    setNewFileName(`${newUUID}.${fileExtension}`)

    console.log('newFileName = ', newFileName)

    const params = {
      ACL: 'public-read',
      Body: file,
      Bucket: S3_BUCKET,
      Key: newFileName
    }

    myBucket
      .putObject(params)
      .on('httpUploadProgress', evt => {
        setProgress(Math.round((evt.loaded / evt.total) * 100))
      })
      .send(err => {
        if (err) console.log(err)
      })
    
    console.log(newUUID)

  }

  return (
    <>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={values => {
          onSubmit(values, selectedFile, newUUID, newFileName)
        }}
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

          <button onClick={() => UploadFileS3(selectedFile)} type='submit'>
            Upload Track
          </button>
          <div>Upload Progress is {progress}%</div>
        </Form>
      </Formik>
    </>
  )
}

export default UploadToAll
