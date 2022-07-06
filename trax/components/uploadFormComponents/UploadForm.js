import React, { useState, useEffect } from 'react'

// AWS package
import AWS from 'aws-sdk'

// Formik Imports
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import FormikControl from './FormikControl'

//UUID package
import { v4 as uuidv4 } from 'uuid' // For creating the unique ID for each track

// DBUpload function
const uploadToDB = async (values, newFileName) => {
  const { title, composer } = values

  const submissionData = { title, composer, newFileName }

  const response = await fetch('/api/tracks', {
    method: 'POST',
    body: JSON.stringify(submissionData),
    headers: {
      'Content-Type': 'application/json'
    }
  })

  console.log('response', response)
  return await response.json()
}

const uploadToS3 = (newFileName, selectedFile) => {
  // AWS config
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
  // AWS config end

  // File Upload structure
  const params = {
    ACL: 'public-read',
    Body: selectedFile,
    Bucket: S3_BUCKET,
    Key: newFileName
  }

  myBucket
    .putObject(params)
    .send(err => {
      if (err) console.log(err)
    })
}

function UploadForm() {
  const [selectedFile, setSelectedFile] = useState(null) //Holds file selected from form
  const [uuid, setUuid] = useState('')

  // Formik Setup
  const initialValues = {
    title: '',
    composer: ''
  }

  const validationSchema = Yup.object({
    title: Yup.string().required('Required'),
    composer: Yup.string().required('Required')
  })
  // End Formik Setup

  useEffect(() => {
    setUuid(`${uuidv4()}`) // Generate a unique ID for each track 
  }, [])

  const onSubmit = values => {
    var fileExtension = selectedFile.name.split('.').pop() // file extension minus dot
    var uuidFileName = `${uuid}.${fileExtension}`
    uploadToDB(values, uuidFileName)
    uploadToS3(uuidFileName, selectedFile)
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={values => onSubmit(values, selectedFile, uuid)}
    >
      {formik => {
        return (
          <Form>
            <FormikControl
              control='input'
              type='title'
              label='Title'
              name='title'
            />
            <FormikControl
              control='input'
              type='composer'
              label='Composer'
              name='composer'
            />
            <FormikControl
              control='fileInput'
              type='file'
              label='File'
              name='file'
              onChange={e => {
                let file = e.target.files[0]
                setUuid(`${uuidv4()}`) // Generate new UUID for file uploads
                setSelectedFile(file)
              }}
              accept='audio/*' // Points browser to audio files
            />
            <button type='submit' disabled={!formik.isValid}>
              Submit
            </button>
          </Form>
        )
      }}
    </Formik>
  )
}

export default UploadForm
