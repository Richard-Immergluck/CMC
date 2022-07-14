import React from 'react'
import { ErrorMessage } from 'formik'
import TextError from './TextError'
import Form from 'react-bootstrap/Form'

function FileInput(props) {
  const { label, name, ...rest } = props

  return (
    <div className='form-control'>
      <Form.Group controlId='formFile' className='mb-1' id={name} name={name} {...rest}>
        <Form.Label>{label}</Form.Label>
        <Form.Control required type='file' />
      </Form.Group>
      <ErrorMessage name={name} component={TextError} />
    </div>
  )
}

export default FileInput
