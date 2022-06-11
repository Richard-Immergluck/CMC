import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid' // For creating the unique ID for each track
import TestDBUpload from './TestDBUpload'

// Formik imports
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import TextError from '../TextError'

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

function TestUploadForm() {
  const [fieldValue, setFieldValue] = useState(null)
  const [newUUID, setNewUUID] = useState('')
  const [title, setTitle] = useState('')
  const [composer, setComposer] = useState('')

  const handleFileInput = e => {
    setFieldValue(e.target.files[0])
    setNewUUID(`${uuidv4()}`)
  }

  const onSubmit = values => {
    setComposer(values.composer)
    setTitle(values.title)
    console.log('onSubmit values', values, newUUID, title, composer)
  }

  return (
    <>
      <TestDBUpload
        file={fieldValue}
        uuid={newUUID}
        title={title}
        composer={composer}
      />
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={values => {
          onSubmit(values, newUUID)
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

          <button
            onClick={() => onSubmit(fieldValue)}
            type='submit'
            disabled={Formik.isSubmitting && !Formik.isValid}
          >
            Upload Track
          </button>
          <div>Upload Progress is ???% Add this from a child component</div>
        </Form>
      </Formik>
    </>
  )
}

export default TestUploadForm
