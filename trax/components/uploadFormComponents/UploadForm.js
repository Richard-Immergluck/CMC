import React, { useState, useEffect } from 'react'

// Bootstrap imports
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Stack from 'react-bootstrap/Stack'
import { Form as BSForm } from 'react-bootstrap/Form'

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
  // Destructure values
  const { title, composer, previewStartString, priceString } = values

  // Create the additional submission variables
  var previewStart = Number(previewStartString)
  var previewEnd = previewStart + 15
  var price = parseInt(priceString)
  var formattedPrice = `£${price.toFixed(2)}`

  // Create the submission object
  const submissionData = {
    title,
    composer,
    newFileName,
    previewStart,
    previewEnd,
    price,
    formattedPrice
  }

  // Send the submission object to the api endpoint
  const response = await fetch('/api/tracks', {
    method: 'POST',
    body: JSON.stringify(submissionData),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  // console.log('response', response)
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

  // File Upload object structure
  const params = {
    ACL: 'public-read',
    Body: selectedFile,
    Bucket: S3_BUCKET,
    Key: newFileName
  }

  // Upload the file to S3
  myBucket.putObject(params).send(err => {
    if (err) console.log(err)
  })
}

function UploadForm() {
  const [selectedFile, setSelectedFile] = useState(null) //Holds file selected from form
  const [uuid, setUuid] = useState('')

  // Formik Setup
  const initialValues = {
    title: '',
    composer: '',
    previewStartString: '',
    priceString: ''
  }

  const validationSchema = Yup.object({
    title: Yup.string().required('Required!'),
    composer: Yup.string().required('Required!'),
    previewStartString: Yup.string().required('Required!'),
    priceString: Yup.string().required('Required!')
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
            <Container>
              <Row className="justify-content-md-center">
                <Col fluid></Col>
                  <Col xs={8} md={7} lg={6} xl={5} xxl={4}>
                  <div className='bg-light border mt-5 p-3'>
                    <Stack gap={2}>
                      <div className='bg-light border mt-1'>
                        <FormikControl
                          control='fileInput'
                          type='file'
                          label='Select a file to upload:'
                          name='file'
                          onChange={e => {
                            let file = e.target.files[0]
                            setUuid(`${uuidv4()}`) // Generate new UUID for file uploads
                            setSelectedFile(file)
                          }}
                          accept='audio/*' // Points browser to audio files
                        />
                      </div>
                      <div className='bg-light border'>
                        <FormikControl
                          control='input'
                          type='title'
                          label='Title:'
                          name='title'
                        />
                      </div>
                      <div className='bg-light border'>
                        <FormikControl
                          control='input'
                          type='composer'
                          label='Composer:'
                          name='composer'
                        />
                      </div>
                      <div className='bg-light border'>
                        <FormikControl
                          control='input'
                          type='integer'
                          label='Set the preview Start Time:'
                          name='previewStartString'
                        />
                      </div>
                      <div className='bg-light border'>
                        <FormikControl
                          control='moneyInput'
                          type='price'
                          label='Please enter the price of your track:'
                          name='priceString'
                        />
                      </div>
                    </Stack>
                    <div className='d-grid gap-2 mt-2 mb-1'>
                      <Button
                        size='lg'
                        variant='info'
                        type='submit'
                        disabled={!formik.isValid}
                      >
                        Submit
                      </Button>
                    </div>
                    </div>
                  </Col>
                  
                <Col></Col>
              </Row>
            </Container>
          </Form>
        )
      }}
    </Formik>
  )
}

export default UploadForm
