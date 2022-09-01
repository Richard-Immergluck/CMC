import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

// Bootstrap imports
import {
  Container,
  Row,
  Col,
  Button,
  Stack,
  Form,
  InputGroup
} from 'react-bootstrap'

// AWS package
import AWS from 'aws-sdk'

// Formik Imports
import { Formik } from 'formik'
import * as yup from 'yup'

//UUID package
import { v4 as uuidv4 } from 'uuid' // For creating the unique ID for each track

// Function to convert the time input into seconds
const secondMaker = timeSplit => {
  if (timeSplit.length === 2) {
    var previewStart = parseInt(timeSplit[0]) * 60 + parseInt(timeSplit[1])
  } else {
    var previewStart =
      parseInt(timeSplit[0]) * 3600 +
      parseInt(timeSplit[1]) * 60 +
      parseInt(timeSplit[2])
  }
  return previewStart
}

// DBUpload function
const uploadToDB = async (values, newFileName) => {
  const { title, composer, previewStartString, priceString } = values

  // Dealing with various user inputs for the previewStart input field
  if (previewStartString.includes(':')) {
    var timeSplit = previewStartString.split(':')
    var previewStart = secondMaker(timeSplit)
  } else if (previewStartString.includes('.')) {
    var timeSplit = previewStartString.split('.')
    var previewStart = secondMaker(timeSplit)
  } else if (previewStartString.includes(',')) {
    var timeSplit = previewStartString.split(',')
    var previewStart = secondMaker(timeSplit)
  } else {
    var previewStart = parseInt(previewStartString)
  }

  // Create additional submission variables
  var previewEnd = previewStart + 15
  var price = parseFloat(priceString)
  var formattedPrice = `£${price.toFixed(2)}`
  var downloadName = `${title}_${composer}.mp3`
  var downloadCount = 0

  // Create submission object
  const submissionData = {
    title,
    composer,
    key,
    instrumentation,
    newFileName,
    previewStart,
    previewEnd,
    additionalInfo,
    price,
    formattedPrice,
    downloadName,
    downloadCount
  }

  // Send the submission object to the api endpoint
  const response = await fetch('/api/tracks', {
    method: 'POST',
    body: JSON.stringify(submissionData),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return await response.json()
}

const uploadToS3 = (newFileName, selectedFile) => {
  // AWS config
  const S3_BUCKET = process.env.S3_BUCKET_NAME
  const REGION = process.env.S3_REGION

  AWS.config.update({
    accessKeyId: process.env.S3_ACCESS_ID,
    secretAccessKey: process.env.S3_APP_ACCESS_KEY
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
  const [validated, setValidated] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null) //Holds file selected from form
  const [uuid, setUuid] = useState('')

  const ref = useRef()

  const { data: session } = useSession()

  const fileReset = () => {
    ref.current.value = ''
  }

  // Formik Setup
  const initialValues = {
    file: null,
    title: '',
    composer: '',
    key: '',
    instrumentation: '',
    previewStartString: '',
    additionalInfo: '',
    priceString: '',
    terms: false
  }

  const supportedFormats = '.mp3' //Supported file formats - mp3 only for testing purposes

  const validationSchema = yup.object().shape({
    file: yup
      .mixed()
      .required('Please select a file to upload')
      .test('format', 'File format not supported', value => {
        console.log(value)
        var fileExtension = value.split('.').pop() // file extension minus dot
        if (value) {
          return supportedFormats.includes(fileExtension)
        }
      }),
    title: yup.string().required('Please enter a title'),
    composer: yup.string().required('Please enter the composer'),
    key: yup.string().required('Please enter a key signature'),
    instrumentation: yup.string().required('Required'),
    previewStartString: yup.string().required('Required'),
    additionalInfo: yup.string().required('Please enter additional info'),
    priceString: yup.string().required('Price is required'),
    terms: yup.bool().required().oneOf([true], 'Terms must be accepted')
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
    alert('Track uploaded successfully!')
    fileReset()
  }

  if (session && session.user) {
    return (
      <>
        <Formik
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm }) => {
            onSubmit(values, selectedFile, uuid)
            resetForm(initialValues)
          }}
          initialValues={initialValues}
          validateOnChange={false}
          validateOnBlur={false}
        >
          {({ handleSubmit, handleChange, values, isValid, errors }) => (
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
              <Container>
                <Row className='justify-content-md-center'>
                  <Col xs={12} md={9} lg={6} xl={5} xxl={5}>
                    <Container className='bg-light border mt-5 p-3'>
                      <Stack gap={3}>
                        <div className='form-control p-2'>
                          <Form.Group
                            className='position-relative'
                            control='fileInput'
                          >
                            <Form.Label>Select a File</Form.Label>
                            <Form.Control
                              type='file'
                              required
                              name='file'
                              ref={ref}
                              onChange={e => {
                                let file = e.target.files[0]
                                handleChange(e)
                                setUuid(`${uuidv4()}`)
                                setSelectedFile(file)
                                console.log(file.type)
                              }}
                              isInvalid={!!errors.file}
                              accept='audio/*' // Points browser to audio files
                            />
                            <Form.Control.Feedback type='invalid'>
                              {errors.file}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </div>
                        <div className='form-control p-2'>
                          <Form.Group md='3' control='input'>
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                              type='text'
                              placeholder='Title'
                              name='title'
                              value={values.title}
                              onChange={handleChange}
                              isInvalid={!!errors.title}
                            />
                            <Form.Control.Feedback type='invalid'>
                              {errors.title}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </div>
                        <div className='form-control p-2'>
                          <Form.Group md='3' control='input'>
                            <Form.Label>Composer</Form.Label>
                            <Form.Control
                              type='text'
                              placeholder='Composer'
                              name='composer'
                              value={values.composer}
                              onChange={handleChange}
                              isInvalid={!!errors.composer}
                            />
                            <Form.Control.Feedback type='invalid'>
                              {errors.composer}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </div>
                        <div className='form-control p-2'>
                          <Form.Group md='3' control='input'>
                            <Form.Label>Key</Form.Label>
                            <Form.Control
                              type='text'
                              placeholder='e.g. Gb Minor'
                              name='key'
                              value={values.key}
                              onChange={handleChange}
                              isInvalid={!!errors.key}
                            />
                            <Form.Control.Feedback type='invalid'>
                              {errors.key}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </div>
                        <div className='form-control p-2'>
                          <Form.Group md='3' control='input'>
                            <Form.Label>Instrumentation</Form.Label>
                            <Form.Control
                              type='text'
                              placeholder='e.g. Piano, Orchestra'
                              name='instrumentation'
                              value={values.instrumentation}
                              onChange={handleChange}
                              isInvalid={!!errors.instrumentation}
                            />
                            <Form.Control.Feedback type='invalid'>
                              {errors.instrumentation}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </div>
                        <div className='form-control p-2'>
                          <Form.Group md='3' control='input'>
                            <Form.Label>Preview Start Time</Form.Label>
                            <Form.Control
                              type='text'
                              placeholder='Time in Seconds or 00:00:00'
                              name='previewStartString'
                              value={values.previewStartString}
                              onChange={handleChange}
                              isInvalid={!!errors.previewStartString}
                            />
                            <Form.Control.Feedback type='invalid'>
                              {errors.previewStartString}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </div>
                        <div className='form-control p-2'>
                          <Form.Group md='3' control='input'>
                            <Form.Label>Additional Information</Form.Label>
                            <Form.Control
                              type='text'
                              as='textarea'
                              style={{ height: 90 }}
                              placeholder='Tempo, cuts, recitatives, cadenzas etc. Add as much detail as you can. The more detail you add, the more likely your track will be purchased.'
                              name='additionalInfo'
                              value={values.additionalInfo}
                              onChange={handleChange}
                              isInvalid={!!errors.additionalInfo}
                            />
                            <Form.Control.Feedback type='invalid'>
                              {errors.additionalInfo}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </div>
                        <div className='form-control p-2'>
                          <Form.Group md='3' control='input'>
                            <Form.Label>Price</Form.Label>
                            <InputGroup hasValidation>
                              <InputGroup.Text id='inputGroupPrepend'>
                                £
                              </InputGroup.Text>
                              <Form.Control
                                type='text'
                                placeholder='0.00'
                                name='priceString'
                                value={values.priceString}
                                onChange={handleChange}
                                isInvalid={!!errors.priceString}
                              />
                              <Form.Control.Feedback type='invalid'>
                                {errors.priceString}
                              </Form.Control.Feedback>
                            </InputGroup>
                          </Form.Group>
                        </div>
                        <Form.Group className='mb-3'>
                          <Form.Check
                            required
                            name='terms'
                            label='Agree to terms and conditions'
                            onChange={handleChange}
                            isInvalid={!!errors.terms}
                            feedback={errors.terms}
                            feedbackType='invalid'
                            id='validationFormik0'
                          />
                        </Form.Group>
                      </Stack>
                      <Container className='d-grid gap-2 mt-2 mb-1'>
                        <Button
                          size='lg'
                          variant='info'
                          type='submit'
                          disabled={!isValid}
                        >
                          Submit
                        </Button>
                      </Container>
                    </Container>
                  </Col>
                </Row>
              </Container>
            </Form>
          )}
        </Formik>
      </>
    )
  } else {
    return (
      <>
        <p>You must be logged in to upload a track.</p>
      </>
    )
  }
}

export default UploadForm
