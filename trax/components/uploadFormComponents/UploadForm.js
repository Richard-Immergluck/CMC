import React, { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'

// React Bootstrap imports
import {
  Container,
  Row,
  Col,
  Button,
  Stack,
  Form,
  InputGroup,
  Popover,
  OverlayTrigger
} from 'react-bootstrap'

// Formik Imports
import { Formik } from 'formik'
import * as yup from 'yup'

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
  const {
    title,
    composer,
    previewStartString,
    priceString,
    key,
    instrumentation,
    additionalInfo
  } = values

  // Dealing with various user inputs for the preview starting point input field
  if (previewStartString.includes(':')) {
    var timeSplit = previewStartString.split(':')
    var previewStart = secondMaker(timeSplit)
  } else if (previewStartString.includes(';')) {
    var timeSplit = previewStartString.split(';')
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

const uploadToS3 = async selectedFile => {
  const signedUrlResponse = await fetch('/api/uploads/signed-url', {
    method: 'POST',
    body: JSON.stringify({
      fileName: selectedFile.name,
      contentType: selectedFile.type
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })

  const signedUrlData = await signedUrlResponse.json()

  if (!signedUrlResponse.ok) {
    throw new Error(signedUrlData.message || 'Unable to prepare upload')
  }

  const uploadResponse = await fetch(signedUrlData.url, {
    method: 'PUT',
    body: selectedFile,
    headers: {
      'Content-Type': selectedFile.type
    }
  })

  if (!uploadResponse.ok) {
    throw new Error('Unable to upload file')
  }

  return signedUrlData.key
}

function UploadForm() {
  const [validated, setValidated] = useState(false)
  const [validatedAfterSubmit, setValidatedAfterSubmit] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null) // File selected by the user

  // Get the session
  const { data: session } = useSession()

  // ref for the file input field
  const ref = useRef()

  // Function to reset the file input field
  const fileReset = () => {
    ref.current.value = ''
  }

  // --- Formik Setup ---
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
        var fileExtension = value.split('.').pop() // pull file extension from string
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
    terms: yup
      .bool()
      .required()
      .oneOf([true], 'Terms and Conditions must be accepted to submit a track')
  })
  // --- End Formik Setup ---

  const onSubmit = async values => {
    setValidatedAfterSubmit(true)
    const uploadedKey = await uploadToS3(selectedFile)
    await uploadToDB(values, uploadedKey)
    alert('Track uploaded successfully!')
    fileReset()
  }

  const popover = (
    <Popover id='popover-basic'>
      <Popover.Header as='h3'>Terms and Conditions</Popover.Header>
      <Popover.Body>
        <p>
          By submitting a track to the site, you agree to the following terms:
        </p>
        <ul>
          <li>
            You are the owner of the track and have the right to submit it to
            the site.
          </li>
        </ul>
        <p>etc</p>
      </Popover.Body>
    </Popover>
  )

  if (session && session.user) {
    return (
      <>
        <Formik
          validationSchema={validationSchema}
          onSubmit={async (values, { resetForm }) => {
            await onSubmit(values, selectedFile)
            resetForm(initialValues)
          }}
          initialValues={initialValues}
          validateOnChange={false} // should be set to true after first submission using validatedAfterSubmit and !isvalid in submit onclick - see below
          validateOnBlur={false}
        >
          {({ handleSubmit, handleChange, values, errors }) => (
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
                                setSelectedFile(file)
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
                            <Form.Label>Preview Starting Point</Form.Label>
                            <br />
                            <small className='form-text text-muted'>
                              Select the time from which you would like the
                              preview of your track to start. This can be in
                              seconds or 00:00:00 format
                            </small>
                            <Form.Control
                              type='text'
                              placeholder='eg. 00:35 or 35'
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
                          <OverlayTrigger
                            trigger='click'
                            placement='right'
                            overlay={popover}
                          >
                            <p>
                              Click here to view the terms and conditions
                            </p>
                          </OverlayTrigger>
                          <Form.Check
                            required
                            name='terms'
                            label='Agree to terms and conditions'
                            onChange={handleChange}
                            isInvalid={!!errors.terms}
                            feedback={errors.terms}
                            feedbackType='invalid'
                            id='validationFormik'
                          />
                        </Form.Group>
                      </Stack>
                      <Container className='d-grid gap-2 mt-2 mb-1'>
                        <br />
                        <Button
                          size='lg'
                          variant='info'
                          type='submit'
                          // disabled={!isValid} // Disables button if form is invalid - needs to be fixed in conjunction with validation on change
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
