import React from 'react'
import {
  Formik,
  Form,
  Field,
  ErrorMessage,
  FieldArray,

} from 'formik'
import * as Yup from 'yup'
import TextError from '../components/TextError'

const initialValues = {
  fname: '',
  lname:'',
  email: '',
  address: '',
  phNumbers: ['']
}

const onSubmit = values => {
  console.log('form data', values)
}

const validationSchema = Yup.object({
  name: Yup.string().required('Required!'),
  email: Yup.string().email('Invalid email format!').required('Required!'),
  channel: Yup.string().required('Required!')
})

function Register() {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      <Form>
        <div className='form-control'>
          <label htmlFor='fname'>First Name:</label>
          <Field type='text' id='fname' name='fname' placeholder='Enter First Name' />
          <ErrorMessage name='name' component={TextError} />
        </div>

        <div className='form-control'>
          <label htmlFor='lname'>Last Name:</label>
          <Field type='text' id='lname' name='lname' placeholder='Enter Last Name' />
          <ErrorMessage name='name' component={TextError} />
        </div>

        <div className='form-control'>
          <label htmlFor='email'>Email:</label>
          <Field
            type='text'
            id='email'
            name='email'
            placeholder='Enter Email Address'
          />
          <ErrorMessage name='email'>
            {errorMsg => <div className='error'>{errorMsg}</div>}
          </ErrorMessage>
        </div>

        <div className='form-control'>
          <label htmlFor='address'>Address</label>
          <Field name='address'>
            {props => {
              console.log('field render')
              const { field, form, meta } = props
              console.log('render props', props)
              return (
                <div>
                  <input type='text' id='address' {...field} />
                  {meta.touched && meta.error ? <div>{meta.error}</div> : null}
                </div>
              )
            }}
          </Field>
        </div>

        <div className='form-control'>
          <label>Contact phone number</label>
          <FieldArray name='phNumbers'>
            {fieldArrayProps => {
              const { push, remove, form } = fieldArrayProps
              const { values } = form
              const { phNumbers } = values
              return (
                <div>
                  {phNumbers.map((phNumber, index) => (
                    <div key={index}>
                      <Field name={`phNumbers[${index}]`} />
                      {index > 0 && (
                        <button type='button' onClick={() => remove(index)}>
                          {' '}
                          -{' '}
                        </button>
                      )}
                      <button type='button' onClick={() => push('')}>
                        {' '}
                        +{' '}
                      </button>
                    </div>
                  ))}
                </div>
              )
            }}
          </FieldArray>
        </div>

        <button type='submit'>Submit</button>
      </Form>
    </Formik>
  )
}

export default Register