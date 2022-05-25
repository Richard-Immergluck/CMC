import React from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import TextError from '../components/TextError'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const getServerSideProps = async () => {
  const tracks = await prisma.track.findMany()
  return {
    props: {
      initialTracks: tracks
    }
  }
}

const saveTrack = async (track) => {
  const response = await fetch('/api/tracks', {
    method: 'POST',
    body: JSON.stringify(track),
    headers: {
      'Content-Type': 'application/json'
    }
  })

  console.log("response", track)

  // if (!response.ok) {
  //   throw new Error(response.statusText)
  // }

  return await response.json()
}

const initialValues = {
  title: '',
  composer: ''
}

const validationSchema = Yup.object({
  title: Yup.string().required('Required!'),
  composer: Yup.string().required('Required!')
})


const onSubmit = data => {
saveTrack(data)
}

function TrackUploadForm() {
  return (
    <div>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
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
          <button type='submit'>Submit</button>
        </Form>
      </Formik>
    </div>
  )
}

export default TrackUploadForm
