import React, { useState } from 'react'
import AWS from 'aws-sdk'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import TextError from '../components/TextError'

const initialValues = {
  title: '',
  composer: ''
}

const validationSchema = Yup.object({
  title: Yup.string().required('Required!'),
  composer: Yup.string().required('Required!')
})

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

const UploadTrack = () => {
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)

  const handleFileInput = e => {
    setSelectedFile(e.target.files[0])
  }

  console.log(selectedFile)

  const uploadFileS3 = file => {
    const params = {
      ACL: 'public-read',
      Body: file,
      Bucket: S3_BUCKET,
      Key: file.name
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

  const uploadFileDB = () => {}

  return (
    <div>
      <div>Upload Progress is {progress}%</div>
      <input type='file' onChange={handleFileInput} />
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
      >
        <Form>
          <div className='form-control'>
            <label htmlFor='title'>Title:</label>
            <Field
              type='text'
              id='title'
              name='title'
              placeholder='Title'
            />
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
            <ErrorMessage name='composer' component={TextError} />
          </div>
          <button
            onClick={() => {
              uploadFileS3(selectedFile)
              uploadFileDB(selectedFile)
            }}
          >
            {' '}
            Upload to S3
          </button>
        </Form>
      </Formik>
    </div>
  )
}

export default UploadTrack
