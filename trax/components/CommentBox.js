import React, { useState, useEffect, useLayoutEffect } from 'react'
import { Button, Form } from 'react-bootstrap'
import { Formik } from 'formik'
import * as Yup from 'yup'

// Pull comments from the DB
export const getServerSideProps = async ({ req, res }) => {
  const { trackId } = req.query
  const comments = await prisma.comment.findMany({
    where: {
      trackId: Number(trackId)
    }
  })
  return {
    props: {
      comments
    }
  }
}

// Upload a comment to the DB
const uploadComment = async (values, actions, trackId, user) => {
  
  // console.log('The values:', values)
  // console.log('The actions:', actions)
  // console.log('The trackId:', trackId)
  // console.log('The userId:', user)

  // Create the comment object
  const comment = {
    comment: values.comment,
    trackId: trackId,
    userId: user
  }

  try {
    await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(comment)
    })
    actions.resetForm()
  } catch (err) {
    console.log('from API error', err)
  }
}

const CommentBox = props => {

  const { trackId, user } = props

  return (
    <>
      <Formik
        validateOnBlur={false}
        validateOnChange={false}
        initialValues={{
          comment: ''
        }}
        validationSchema={Yup.object({
          comment: Yup.string()
            .max(500, 'Must be 500 characters or less')
            .required('Required')
        })}
        onSubmit={(values, actions) => {
          uploadComment(values, actions, trackId, user)
          window.location.reload()
        }}
      >
        {formik => (
          <Form noValidate onSubmit={formik.handleSubmit}>
            <Form.Group controlId='comment'>
              <Form.Label>Comment</Form.Label>
              <Form.Control
                as='textarea'
                rows={3}
                {...formik.getFieldProps('comment')}
              />
              {formik.errors.comment ? (
                <div>{formik.errors.comment}</div>
              ) : null}
            </Form.Group>
            <br />
            <Button
              variant='info'
              type='submit'
            >
              Submit
            </Button>
          </Form>
        )}
      </Formik>
    </>
  )
}

export default CommentBox
