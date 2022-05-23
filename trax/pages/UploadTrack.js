import React, { useRef } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import TextError from '../components/TextError'
import S3 from 'react-aws-s3'

function UploadTrack() {
  const fileInput = useRef()

  const handleClick = e => {
    e.preventDetault()
    let file = fileInput.current.files[0]
    let newFileName = fileInput.current.files[0].name
    const config = {
      bucketName: process.env.REACT_APP_BUCKET_NAME,
      region: process.env.REACT_APP_REGION,
      accessKeyId: process.env.REACT_APP_ACCESS_ID,
      secretAccessKey: process.env.REACT_APP_ACCESS_KEY
    }
    const ReactS3Client = new S3(config);
    ReactS3Client.uploadFile(file, newFileName).then(data => {
      console.log(data)
      if (data.status === 204) {
        console.log("Success!")
      } else {
        console.log("Failure!")
      }
    })
  }

  const initialValues = {
    file: ''
  }

  const validationSchema = Yup.object({
    file: Yup.mixed().required('File is required')
  })

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleClick}
    >
      <Form>
        <div className='form-control'>
          <label htmlFor='file'>Upload a File</label>
          <Field type='file' id='file' name='uploadfile' />
          <ErrorMessage name='name' component={TextError} />
        </div>
        <button type='submit'>Submit Upload</button>
      </Form>
    </Formik>
  )
}

export default UploadTrack
