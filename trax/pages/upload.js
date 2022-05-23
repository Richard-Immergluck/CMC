import React from 'react'
import {
  Formik,
  Form,
  Field,
  ErrorMessage,
} from 'formik'
import * as Yup from 'yup'
import TextError from '../components/TextError'

const initialValues = {
  file: '',
}

const onSubmit = values => {
  console.log('form data', values)
}

const validationSchema = Yup.object({
  file: Yup.mixed().required('File is required'),
})

function Upload() {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      <Form>
        <div className='form-control'>
          <label htmlFor='file'>Upload a File</label>
          <Field type='file' id='file' name='file'/>
          <ErrorMessage name='name' component={TextError} />
        </div>
        <button type='submit'>Submit Upload</button>
      </Form>
    </Formik>
  )
}

export default Upload
