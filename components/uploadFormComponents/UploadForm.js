import React, { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

// React Bootstrap imports
import {
  Alert,
  Button,
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
  var pricePence = Math.round(price * 100)
  var currency = 'gbp'
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
    pricePence,
    currency,
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
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Unable to create track')
  }

  return data
}

const uploadToS3 = async selectedFile => {
  if (!selectedFile) {
    throw new Error('Please select an MP3 file to upload')
  }

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

const canUploadTracks = user => {
  return user?.accountStatus === 'ACTIVE' && (
    user.role === 'ADMIN' ||
    (user.role === 'UPLOADER' && user.uploaderStatus === 'APPROVED')
  )
}

function UploadForm() {
  const [selectedFile, setSelectedFile] = useState(null) // File selected by the user
  const [uploadError, setUploadError] = useState('')
  const [showUploadComplete, setShowUploadComplete] = useState(false)

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
        if (!value) {
          return false
        }

        var fileExtension = value.split('.').pop().toLowerCase() // pull file extension from string
        return supportedFormats.includes(`.${fileExtension}`)
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
    setUploadError('')
    const uploadedKey = await uploadToS3(selectedFile)
    await uploadToDB(values, uploadedKey)
    setShowUploadComplete(true)
    fileReset()
    setSelectedFile(null)
  }

  const uploadAnotherTrack = () => {
    setShowUploadComplete(false)
    setUploadError('')
    setSelectedFile(null)

    if (ref.current) {
      fileReset()
    }
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

  if (session && session.user && canUploadTracks(session.user)) {
    return (
      <>
        <Formik
          validationSchema={validationSchema}
          onSubmit={async (values, { resetForm, setSubmitting }) => {
            try {
              await onSubmit(values)
              resetForm({ values: initialValues })
            } catch (error) {
              setUploadError(error.message || 'Unable to upload track')
            } finally {
              setSubmitting(false)
            }
          }}
          initialValues={initialValues}
          validateOnChange={false} // should be set to true after first submission using validatedAfterSubmit and !isvalid in submit onclick - see below
          validateOnBlur={false}
        >
          {({ handleSubmit, handleChange, setFieldValue, values, errors, isSubmitting }) => (
            <Form noValidate onSubmit={handleSubmit} className='cmc-upload-form'>
              <main className='cmc-upload-page'>
                <div className='container'>
                  <section className='cmc-upload-hero'>
                    <div>
                      <p className='cmc-kicker'>Uploader workspace</p>
                      <h1>Upload Form</h1>
                      <p className='cmc-upload-copy'>
                        Submit an MP3 backing track for review. Approved tracks are published to the catalogue after moderation.
                      </p>
                    </div>
                    <aside className='cmc-upload-status-panel' aria-label='Upload review process'>
                      <span>Review process</span>
                      <strong>Draft to approval</strong>
                      <p>Uploads are stored privately and checked by an admin before buyers can see them.</p>
                    </aside>
                  </section>

                  <section className='cmc-upload-layout'>
                    <aside className='cmc-upload-guidance'>
                      <h2>Before You Submit</h2>
                      <ul>
                        <li>Use MP3 audio only.</li>
                        <li>Choose a short preview start point for buyers.</li>
                        <li>Add performance notes that help musicians assess the track.</li>
                        <li>Only upload material you own or are allowed to distribute.</li>
                      </ul>
                    </aside>

                    <div className='cmc-upload-panel'>
                      {uploadError && <Alert variant='danger'>{uploadError}</Alert>}

                      <div className='cmc-upload-fields'>
                        <Form.Group className='cmc-upload-field' controlId='upload-file'>
                          <Form.Label>Select a File</Form.Label>
                          <Form.Control
                            type='file'
                            required
                            name='file'
                            ref={ref}
                            onChange={e => {
                              let file = e.target.files[0]
                              setFieldValue('file', file?.name || '')
                              setSelectedFile(file)
                            }}
                            isInvalid={!!errors.file}
                            accept='audio/mpeg,audio/mp3'
                          />
                          <Form.Text>MP3 files only.</Form.Text>
                          <Form.Control.Feedback type='invalid'>
                            {errors.file}
                          </Form.Control.Feedback>
                        </Form.Group>

                        <div className='cmc-upload-field-grid'>
                          <Form.Group className='cmc-upload-field' controlId='upload-title'>
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

                          <Form.Group className='cmc-upload-field' controlId='upload-composer'>
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

                        <div className='cmc-upload-field-grid'>
                          <Form.Group className='cmc-upload-field' controlId='upload-key'>
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

                          <Form.Group className='cmc-upload-field' controlId='upload-instrumentation'>
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

                        <div className='cmc-upload-field-grid'>
                          <Form.Group className='cmc-upload-field' controlId='upload-preview-start'>
                            <Form.Label>Preview Starting Point</Form.Label>
                            <Form.Control
                              type='text'
                              placeholder='eg. 00:35 or 35'
                              name='previewStartString'
                              value={values.previewStartString}
                              onChange={handleChange}
                              isInvalid={!!errors.previewStartString}
                              aria-describedby='upload-preview-help'
                            />
                            <Form.Text id='upload-preview-help'>
                              Seconds or 00:00:00 format.
                            </Form.Text>
                            <Form.Control.Feedback type='invalid'>
                              {errors.previewStartString}
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group className='cmc-upload-field' controlId='upload-price'>
                            <Form.Label>Price</Form.Label>
                            <InputGroup hasValidation>
                              <InputGroup.Text>£</InputGroup.Text>
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

                        <Form.Group className='cmc-upload-field' controlId='upload-additional-info'>
                          <Form.Label>Additional Information</Form.Label>
                          <Form.Control
                            type='text'
                            as='textarea'
                            rows={5}
                            placeholder='Tempo, cuts, recitatives, cadenzas etc. Add as much detail as you can.'
                            name='additionalInfo'
                            value={values.additionalInfo}
                            onChange={handleChange}
                            isInvalid={!!errors.additionalInfo}
                          />
                          <Form.Control.Feedback type='invalid'>
                            {errors.additionalInfo}
                          </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className='cmc-upload-terms' controlId='upload-terms'>
                          <OverlayTrigger trigger='click' placement='top' overlay={popover}>
                            <button className='cmc-upload-terms-button' type='button'>
                              View terms and conditions
                            </button>
                          </OverlayTrigger>
                          <Form.Check
                            required
                            name='terms'
                            label='Agree to terms and conditions'
                            onChange={handleChange}
                            isInvalid={!!errors.terms}
                            feedback={errors.terms}
                            feedbackType='invalid'
                            id='upload-terms-check'
                          />
                        </Form.Group>
                      </div>

                      <div className='cmc-upload-submit'>
                        <Button size='lg' variant='info' type='submit' disabled={isSubmitting}>
                          {isSubmitting ? 'Uploading...' : 'Submit'}
                        </Button>
                      </div>
                    </div>
                  </section>
                </div>
              </main>
            </Form>
          )}
        </Formik>
        {showUploadComplete && (
          <div
            className='modal d-block'
            role='dialog'
            aria-modal='true'
            aria-labelledby='upload-complete-title'
            tabIndex='-1'
          >
            <div className='modal-dialog modal-dialog-centered'>
              <div className='modal-content'>
                <div className='modal-header'>
                  <h5 className='modal-title' id='upload-complete-title'>
                    Track submitted for review
                  </h5>
                  <button
                    type='button'
                    className='btn-close'
                    aria-label='Close'
                    onClick={() => setShowUploadComplete(false)}
                  />
                </div>
                <div className='modal-body'>
                  <p>
                    Your track has been uploaded as a draft and is now waiting
                    for review. It will not appear in the public catalogue until
                    it has been checked and approved.
                  </p>
                  <p className='mb-0'>
                    You can upload another track now, return to the catalogue,
                    or open the admin console to review pending submissions.
                  </p>
                </div>
                <div className='modal-footer'>
                  <Button variant='outline-secondary' onClick={uploadAnotherTrack}>
                    Upload Another
                  </Button>
                  <Link href='/catalogue' passHref legacyBehavior>
                    <a className='btn btn-outline-info'>Catalogue</a>
                  </Link>
                  <Link href='/admin' passHref legacyBehavior>
                    <a className='btn btn-info'>Review Submissions</a>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  } else if (session && session.user) {
    return (
      <main className='cmc-upload-page'>
        <div className='container'>
          <section className='cmc-upload-auth-panel'>
            <p className='cmc-kicker'>Uploader workspace</p>
            <h1>Upload Form</h1>
            <p>Approved uploader access is required before you can submit tracks.</p>
            <Link href='/profile' className='cmc-button cmc-button--secondary'>
              Go to Profile
            </Link>
          </section>
        </div>
      </main>
    )
  } else {
    return (
      <main className='cmc-upload-page'>
        <div className='container'>
          <section className='cmc-upload-auth-panel'>
            <p className='cmc-kicker'>Uploader workspace</p>
            <h1>Upload Form</h1>
            <p>You must be logged in to upload a track.</p>
            <Link href='/login' className='cmc-button cmc-button--primary'>
              Sign In
            </Link>
          </section>
        </div>
      </main>
    )
  }
}

export default UploadForm
