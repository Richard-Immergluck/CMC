import React from 'react'
import { ErrorMessage } from 'formik'
import TextError from './TextError'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'

function Input(props) {
  const { label, name, ...rest } = props

  return (
    <div className='form-control'>
      <Form.Label htmlFor={name}>{label}</Form.Label>
      <InputGroup className='mb-1'>
        <Form.Control aria-label={name} id={name} name={name} {...rest} />
      </InputGroup>
      <ErrorMessage component={TextError} name={name} />
    </div>
  )
}

export default Input
