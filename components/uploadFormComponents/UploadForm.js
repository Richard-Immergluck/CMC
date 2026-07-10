'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

// React Bootstrap imports
import {
  Alert,
  Form
} from 'react-bootstrap'

// Formik Imports
import { Formik } from 'formik'
import * as yup from 'yup'
import BrandDisplayText from '../brand/BrandDisplayText'
import { canStartTrackUpload } from '../../lib/access-control.mjs'
import {
  atomicTrackCatalogueTypes,
  catalogueTypes,
  formatPricePence,
  getPricingBand,
  getPricingReviewStatus,
  isAllowedPriceForCatalogueType,
  pricingReviewStatuses,
  saleFormats,
  trackTypeLabels
} from '../../lib/pricing-policy.mjs'
import { Button, Panel } from '../ui/primitives'

const PREVIEW_LENGTH_SECONDS = 15
const WAVEFORM_BAR_COUNT = 180

const formatSeconds = seconds => {
  if (!Number.isFinite(seconds)) {
    return '0:00'
  }

  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

const createFallbackWaveform = () => Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) => {
  const wave = Math.sin(index * 0.28) * 0.28
  const pulse = Math.sin(index * 0.071) * 0.22
  return Math.max(0.12, Math.min(1, 0.5 + wave + pulse))
})

const buildWaveformPeaks = audioBuffer => {
  const channelData = audioBuffer.getChannelData(0)
  const samplesPerBar = Math.max(1, Math.floor(channelData.length / WAVEFORM_BAR_COUNT))

  return Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) => {
    const start = index * samplesPerBar
    const end = Math.min(channelData.length, start + samplesPerBar)
    let peak = 0

    for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
      peak = Math.max(peak, Math.abs(channelData[sampleIndex]))
    }

    return Math.max(0.08, Math.min(1, peak))
  })
}

const createUploadBatch = async ({ label }) => {
  const response = await fetch('/api/upload-batches', {
    method: 'POST',
    body: JSON.stringify({
      label
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Unable to create upload batch')
  }

  return data.batch
}

// DBUpload function
const uploadToDB = async (values, newFileName, { uploadBatchId } = {}) => {
  const {
    title,
    composer,
    previewStart,
    previewEnd,
    durationSeconds,
    sourceContentType,
    priceString,
    catalogueType,
    saleFormat,
    pricingTier,
    pricingJustification,
    key,
    instrumentation,
    additionalInfo,
    fulfilledRequestId
  } = values

  // Create additional submission variables
  var price = parseFloat(priceString)
  var pricePence = Math.round(price * 100)
  var currency = 'gbp'
  var formattedPrice = `£${price.toFixed(2)}`
  var downloadName = `${title}_${composer}.mp3`
  var downloadCount = 0
  const fallbackFulfilledRequestId = typeof window === 'undefined'
    ? ''
    : new URLSearchParams(window.location.search).get('fulfilledRequestId')
  const resolvedFulfilledRequestId = fulfilledRequestId || fallbackFulfilledRequestId || undefined

  // Create submission object
  const submissionData = {
    title,
    composer,
    key,
    instrumentation,
    newFileName,
    previewStart,
    previewEnd,
    durationSeconds,
    sourceContentType,
    additionalInfo,
    price,
    pricePence,
    currency,
    formattedPrice,
    catalogueType,
    saleFormat,
    pricingTier,
    pricingJustification,
    downloadName,
    downloadCount,
    fulfilledRequestId: resolvedFulfilledRequestId,
    uploadBatchId
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

const UploadPageTitle = () => (
  <div className='cmc-upload-title'>
    <div className='cmc-home-section-label cmc-upload-title-marker'>
      <div className='cmc-home-section-mark' aria-hidden='true'>
        <span className='cmc-home-section-mark__bar cmc-home-section-mark__bar--archive' />
        <span className='cmc-home-section-mark__bar cmc-home-section-mark__bar--catalogue' />
        <span className='cmc-home-section-mark__bar cmc-home-section-mark__bar--community' />
      </div>
      <p className='cmc-kicker'>Uploader workspace</p>
    </div>
    <h1>
      <BrandDisplayText text='Share a Track.' />
    </h1>
    <p className='cmc-upload-copy'>
      Add a track to the catalogue for review. Once approved, it can be discovered,
      purchased, requested and discussed by the community.
    </p>
  </div>
)

const UploadPreviewSelector = ({
  audioUrl,
  duration,
  isConfirmed,
  isLoading,
  onBack,
  onConfirm,
  onSelectionChange,
  previewStart,
  waveformPeaks
}) => {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const safeDuration = Math.max(PREVIEW_LENGTH_SECONDS, duration || PREVIEW_LENGTH_SECONDS)
  const maxPreviewStart = Math.max(0, safeDuration - PREVIEW_LENGTH_SECONDS)
  const previewEnd = Math.min(safeDuration, previewStart + PREVIEW_LENGTH_SECONDS)
  const startPercentage = (previewStart / safeDuration) * 100
  const widthPercentage = ((previewEnd - previewStart) / safeDuration) * 100
  const previewLabel = `${formatSeconds(previewStart)} - ${formatSeconds(previewEnd)}`

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) {
      return undefined
    }

    const handleTimeUpdate = () => {
      if (audio.currentTime >= previewEnd) {
        audio.pause()
        audio.currentTime = previewStart
        setIsPlaying(false)
      }
    }

    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [previewEnd, previewStart])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    audio.pause()
    audio.currentTime = previewStart
    setIsPlaying(false)
  }, [previewStart])

  const updateFromPointer = useCallback(event => {
    const rect = event.currentTarget.getBoundingClientRect()
    const pointerRatio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    const nextStart = Math.min(maxPreviewStart, Math.max(0, pointerRatio * safeDuration - (PREVIEW_LENGTH_SECONDS / 2)))
    onSelectionChange(Math.round(nextStart))
  }, [maxPreviewStart, onSelectionChange, safeDuration])

  const handlePointerDown = event => {
    updateFromPointer(event)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = event => {
    if (event.buttons !== 1) {
      return
    }

    updateFromPointer(event)
  }

  const togglePlayback = () => {
    const audio = audioRef.current

    if (!audio || !audioUrl) {
      return
    }

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    audio.currentTime = previewStart
    audio.play().then(() => {
      setIsPlaying(true)
    }).catch(() => {
      setIsPlaying(false)
    })
  }

  return (
    <div className='cmc-upload-preview-selector'>
      <div className='cmc-upload-preview-toolbar'>
        <div>
          <h3>Choose the buyer preview</h3>
          <p>Drag the highlighted 15-second window, then play it back before confirming.</p>
        </div>
        <span>{isLoading ? 'Preparing waveform...' : previewLabel}</span>
      </div>

      <div className='cmc-upload-preview-board'>
        <Button
          aria-label={isPlaying ? 'Pause selected preview' : 'Play selected preview'}
          className='cmc-upload-preview-play'
          disabled={!audioUrl || isLoading}
          type='button'
          onClick={togglePlayback}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <div
          aria-label='Preview selection waveform'
          aria-valuemax={Math.round(maxPreviewStart)}
          aria-valuemin={0}
          aria-valuenow={Math.round(previewStart)}
          className={isLoading ? 'cmc-upload-waveform cmc-upload-waveform--loading' : 'cmc-upload-waveform'}
          role='slider'
          tabIndex={0}
          onKeyDown={event => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              onSelectionChange(Math.max(0, previewStart - 1))
            }

            if (event.key === 'ArrowRight') {
              event.preventDefault()
              onSelectionChange(Math.min(maxPreviewStart, previewStart + 1))
            }
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          <span
            aria-hidden='true'
            className='cmc-upload-preview-window'
            style={{
              left: `${startPercentage}%`,
              width: `${widthPercentage}%`
            }}
          />
          {waveformPeaks.map((peak, index) => (
            <span
              aria-hidden='true'
              key={`${index}-${peak}`}
              style={{
                '--cmc-upload-waveform-bar-height': `${Math.max(0.12, peak) * 100}%`,
                '--cmc-wave-bar': `${Math.max(0.12, peak) * 100}%`,
                '--cmc-wave-delay': `${index * -28}ms`
              }}
            />
          ))}
        </div>
      </div>

      <audio ref={audioRef} src={audioUrl || undefined} preload='metadata' />

      <div className='cmc-upload-step-actions'>
        <Button disabled={isLoading} type='button' variant='subtle' onClick={onBack}>
          Back
        </Button>
        <Button disabled={!audioUrl || isLoading} type='button' onClick={onConfirm}>
          {isConfirmed ? 'Preview confirmed' : 'Confirm preview'}
        </Button>
      </div>
    </div>
  )
}

function UploadForm({ initialFulfilledRequestId = '' }) {
  const fulfilledRequestId = initialFulfilledRequestId
  const [selectedFile, setSelectedFile] = useState(null) // File selected by the user
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [waveformPeaks, setWaveformPeaks] = useState(() => createFallbackWaveform())
  const [waveformLoading, setWaveformLoading] = useState(false)
  const [audioDuration, setAudioDuration] = useState(PREVIEW_LENGTH_SECONDS)
  const [previewStart, setPreviewStart] = useState(0)
  const [previewConfirmed, setPreviewConfirmed] = useState(false)
  const [detailsConfirmed, setDetailsConfirmed] = useState(false)
  const [pricingConfirmed, setPricingConfirmed] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [showUploadComplete, setShowUploadComplete] = useState(false)
  const [uploadMode, setUploadMode] = useState('single')
  const [batchLabel, setBatchLabel] = useState('')
  const [activeUploadBatch, setActiveUploadBatch] = useState(null)

  // Get the session
  const { data: session } = useSession()

  // ref for the file input field
  const ref = useRef()

  // Function to reset the file input field
  const fileReset = () => {
    if (ref.current) {
      ref.current.value = ''
    }
  }

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  // --- Formik Setup ---
  const initialValues = {
    file: null,
    title: '',
    composer: '',
    key: '',
    instrumentation: '',
    previewStart: 0,
    previewEnd: PREVIEW_LENGTH_SECONDS,
    durationSeconds: PREVIEW_LENGTH_SECONDS,
    sourceContentType: '',
    additionalInfo: '',
    catalogueType: catalogueTypes.singleTrack,
    saleFormat: saleFormats.individual,
    pricingTier: '',
    pricingJustification: '',
    priceString: '2.99',
    fulfilledRequestId,
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
    previewStart: yup.number().integer().min(0).required(),
    previewEnd: yup.number().integer().moreThan(yup.ref('previewStart')).required(),
    durationSeconds: yup.number().integer().min(1).required(),
    sourceContentType: yup.string().required(),
    additionalInfo: yup.string().required('Please enter additional info'),
    catalogueType: yup.string().oneOf(atomicTrackCatalogueTypes).required(),
    saleFormat: yup.string().oneOf([saleFormats.individual]).required(),
    pricingTier: yup.string(),
    pricingJustification: yup.string().max(2000),
    priceString: yup
      .string()
      .required('Price is required')
      .test('cmc-price-tier', 'Choose one of the approved CMC pricing tiers', function testPriceTier(value) {
        const pricePence = Math.round(Number(value) * 100)

        return isAllowedPriceForCatalogueType({
          catalogueType: this.parent.catalogueType,
          pricePence
        })
      }),
    terms: yup
      .bool()
      .required()
      .oneOf([true], 'Terms and Conditions must be accepted to submit a track')
  })
  // --- End Formik Setup ---

  const onSubmit = async values => {
    if (!uploadedFileName) {
      throw new Error('Please upload an MP3 file before submitting')
    }

    setUploadError('')
    let uploadBatch = activeUploadBatch

    if (uploadMode === 'batch' && !uploadBatch) {
      uploadBatch = await createUploadBatch({
        label: batchLabel.trim() || `${values.composer || 'CMC'} upload batch`
      })
      setActiveUploadBatch(uploadBatch)
    }

    await uploadToDB(values, uploadedFileName, {
      uploadBatchId: uploadBatch?.id
    })
    setShowUploadComplete(true)
    fileReset()
    setSelectedFile(null)
  }

  const uploadAnotherTrack = () => {
    setShowUploadComplete(false)
    setUploadError('')
    setSelectedFile(null)
    setUploadedFileName('')
    setWaveformPeaks(createFallbackWaveform())
    setAudioDuration(PREVIEW_LENGTH_SECONDS)
    setPreviewStart(0)
    setPreviewConfirmed(false)
    setDetailsConfirmed(false)
    setPricingConfirmed(false)

    fileReset()
  }

  if (session && session.user && canStartTrackUpload(session.user)) {
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
          enableReinitialize
          validateOnChange={false} // should be set to true after first submission using validatedAfterSubmit and !isvalid in submit onclick - see below
          validateOnBlur={false}
        >
          {({
            errors,
            handleChange,
            handleSubmit,
            isSubmitting,
            setFieldTouched,
            setFieldValue,
            validateForm,
            values
          }) => {
            const previewEnd = Math.min(audioDuration, previewStart + PREVIEW_LENGTH_SECONDS)
            const maxPreviewStart = Math.max(0, audioDuration - PREVIEW_LENGTH_SECONDS)
            const canShowUploadStep = !uploadedFileName && !uploadingAudio
            const canShowUploadSummary = Boolean(uploadedFileName || uploadingAudio)
            const canShowPreview = Boolean(audioUrl && (uploadedFileName || uploadingAudio))
            const canShowDetails = previewConfirmed
            const canShowPricing = previewConfirmed && detailsConfirmed
            const canShowTerms = canShowPricing && pricingConfirmed
            const isReadyToSubmit = Boolean(uploadedFileName && previewConfirmed && detailsConfirmed && pricingConfirmed && values.terms)
            const pricingBand = getPricingBand(values.catalogueType)
            const selectedPricePence = Math.round(Number(values.priceString || 0) * 100)
            const pricingReviewStatus = getPricingReviewStatus({
              catalogueType: values.catalogueType,
              pricePence: selectedPricePence
            })
            const needsPricingReview = pricingReviewStatus === pricingReviewStatuses.needsReview
            const isBatchMode = uploadMode === 'batch'

            const resetUploadProgress = () => {
              setUploadedFileName('')
              setPreviewConfirmed(false)
              setDetailsConfirmed(false)
              setPricingConfirmed(false)
              setPreviewStart(0)
              setAudioDuration(PREVIEW_LENGTH_SECONDS)
              setWaveformPeaks(createFallbackWaveform())
              setFieldValue('previewStart', 0)
              setFieldValue('previewEnd', PREVIEW_LENGTH_SECONDS)
              setFieldValue('durationSeconds', PREVIEW_LENGTH_SECONDS)
              setFieldValue('sourceContentType', '')
            }

            const decodeAudioFile = async file => {
              setWaveformLoading(true)

              try {
                const arrayBuffer = await file.arrayBuffer()
                const AudioContext = window.AudioContext || window.webkitAudioContext

                if (!AudioContext) {
                  throw new Error('Audio preview is not supported in this browser')
                }

                const audioContext = new AudioContext()
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))
                const nextDuration = Math.max(1, Math.round(audioBuffer.duration))
                const nextPreviewEnd = Math.min(nextDuration, PREVIEW_LENGTH_SECONDS)

                setWaveformPeaks(buildWaveformPeaks(audioBuffer))
                setAudioDuration(nextDuration)
                setPreviewStart(0)
                setFieldValue('previewStart', 0)
                setFieldValue('previewEnd', nextPreviewEnd)
                setFieldValue('durationSeconds', nextDuration)
                setFieldValue('sourceContentType', file.type || 'audio/mpeg')

                await audioContext.close?.()
              } finally {
                setWaveformLoading(false)
              }
            }

            const handleFileChange = event => {
              const file = event.target.files[0]

              if (audioUrl) {
                URL.revokeObjectURL(audioUrl)
              }

              setUploadError('')
              setSelectedFile(file || null)
              setFieldValue('file', file?.name || '')
              setAudioUrl(file ? URL.createObjectURL(file) : '')
              resetUploadProgress()
            }

            const handleFileDrop = event => {
              event.preventDefault()
              const file = event.dataTransfer.files?.[0]

              if (!file || !ref.current) {
                return
              }

              const dataTransfer = new DataTransfer()
              dataTransfer.items.add(file)
              ref.current.files = dataTransfer.files
              handleFileChange({ target: ref.current })
            }

            const handleUploadAudio = async () => {
              setUploadError('')
              const fileToUpload = selectedFile || ref.current?.files?.[0]

              if (!fileToUpload) {
                setUploadError('Please select an MP3 file to upload')
                return
              }

              setUploadingAudio(true)

              try {
                const [uploadedKey] = await Promise.all([
                  uploadToS3(fileToUpload),
                  decodeAudioFile(fileToUpload)
                ])

                setUploadedFileName(uploadedKey)
              } catch (error) {
                setUploadError(error.message || 'Unable to upload audio')
              } finally {
                setUploadingAudio(false)
              }
            }

            const updatePreviewSelection = nextPreviewStart => {
              const safePreviewStart = Math.round(Math.max(0, Math.min(maxPreviewStart, nextPreviewStart)))
              const safePreviewEnd = Math.round(Math.min(audioDuration, safePreviewStart + PREVIEW_LENGTH_SECONDS))

              setPreviewStart(safePreviewStart)
              setPreviewConfirmed(false)
              setFieldValue('previewStart', safePreviewStart)
              setFieldValue('previewEnd', safePreviewEnd)
            }

            const confirmPreview = () => {
              setFieldValue('previewStart', previewStart)
              setFieldValue('previewEnd', previewEnd)
              setPreviewConfirmed(true)
            }

            const confirmDetails = async () => {
              const validationErrors = await validateForm()
              const fields = ['title', 'composer', 'key', 'instrumentation', 'additionalInfo']
              const hasDetailErrors = fields.some(field => validationErrors[field])

              fields.forEach(field => setFieldTouched(field, true, false))

              if (!hasDetailErrors) {
                setDetailsConfirmed(true)
              }
            }

            const confirmPricing = async () => {
              const validationErrors = await validateForm()
              const fields = ['catalogueType', 'saleFormat', 'priceString', 'pricingJustification']
              fields.forEach(field => setFieldTouched(field, true, false))

              if (!validationErrors.priceString) {
                setPricingConfirmed(true)
              }
            }

            const backToUpload = () => {
              setUploadedFileName('')
              setPreviewConfirmed(false)
              setDetailsConfirmed(false)
              setPricingConfirmed(false)
              setFieldValue('terms', false)
            }

            const backToPreview = () => {
              setPreviewConfirmed(false)
              setDetailsConfirmed(false)
              setPricingConfirmed(false)
              setFieldValue('terms', false)
            }

            const backToDetails = () => {
              setDetailsConfirmed(false)
              setPricingConfirmed(false)
              setFieldValue('terms', false)
            }

            const backToPricing = () => {
              setPricingConfirmed(false)
              setFieldValue('terms', false)
            }

            const chooseSingleMode = () => {
              setUploadMode('single')
              setActiveUploadBatch(null)
            }

            const chooseBatchMode = () => {
              setUploadMode('batch')
            }

            const startNewBatch = () => {
              setActiveUploadBatch(null)
              setBatchLabel('')
              setShowUploadComplete(false)
            }

            return (
              <Form noValidate onSubmit={handleSubmit} className='cmc-upload-form'>
              <main className='cmc-upload-page'>
                <div className='container'>
                  <section className='cmc-upload-hero'>
                    <UploadPageTitle />
                  </section>

                  <section className='cmc-upload-layout'>
                    <Panel as='aside' className='cmc-upload-guidance'>
                      <h2>Before You Submit</h2>
                      <ul>
                        <li>Use MP3 audio only.</li>
                        <li>Choose a short preview start point for buyers.</li>
                        <li>Add performance notes that help musicians assess the track.</li>
                        <li>Only upload material you own or are allowed to distribute.</li>
                      </ul>
                    </Panel>

                    <Panel className='cmc-upload-panel'>
                      {uploadError && <Alert variant='danger'>{uploadError}</Alert>}
                      {fulfilledRequestId && (
                        <Alert variant='info'>
                          This upload will be attached to request #{fulfilledRequestId} after submission.
                        </Alert>
                      )}

                      <div className='cmc-upload-fields'>
                        <section className='cmc-upload-mode-panel' aria-labelledby='upload-mode-heading'>
                          <div className='cmc-upload-step-heading'>
                            <span>Upload mode</span>
                            <h2 id='upload-mode-heading'>Choose how this upload should be organised</h2>
                            <p>Use a batch when several tracks belong to the same first import, song cycle, scene, or teaching collection.</p>
                          </div>
                          <div className='cmc-upload-mode-options' role='radiogroup' aria-label='Upload mode'>
                            <button
                              aria-checked={!isBatchMode}
                              className={!isBatchMode ? 'cmc-upload-mode-option cmc-upload-mode-option--active' : 'cmc-upload-mode-option'}
                              onClick={chooseSingleMode}
                              role='radio'
                              type='button'
                            >
                              <strong>Single track</strong>
                              <span>Submit one track for review.</span>
                            </button>
                            <button
                              aria-checked={isBatchMode}
                              className={isBatchMode ? 'cmc-upload-mode-option cmc-upload-mode-option--active' : 'cmc-upload-mode-option'}
                              onClick={chooseBatchMode}
                              role='radio'
                              type='button'
                            >
                              <strong>Batch upload</strong>
                              <span>Keep adding tracks to the same upload batch.</span>
                            </button>
                          </div>

                          {isBatchMode && (
                            <div className='cmc-upload-batch-fields'>
                              <label htmlFor='upload-batch-label'>
                                <span>Batch label</span>
                                <input
                                  id='upload-batch-label'
                                  maxLength={255}
                                  onChange={event => setBatchLabel(event.target.value)}
                                  placeholder='e.g. Mozart opera scenes import'
                                  type='text'
                                  value={activeUploadBatch?.label || batchLabel}
                                  disabled={Boolean(activeUploadBatch)}
                                />
                              </label>
                              {activeUploadBatch ? (
                                <div className='cmc-upload-batch-status' role='status'>
                                  <strong>{activeUploadBatch.label || `Upload batch #${activeUploadBatch.id}`}</strong>
                                  <span>New tracks will be attached to this batch.</span>
                                  <Button type='button' variant='subtle' onClick={startNewBatch}>
                                    Start new batch
                                  </Button>
                                </div>
                              ) : (
                                <p>The batch will be created when the first track is submitted.</p>
                              )}
                            </div>
                          )}
                        </section>

                        {canShowUploadStep && (
                          <>
                            <Form.Group className='cmc-upload-field' controlId='upload-file'>
                              <Form.Label>Select a File</Form.Label>
                              <label
                                className={selectedFile ? 'cmc-upload-dropzone cmc-upload-dropzone--selected' : 'cmc-upload-dropzone'}
                                htmlFor='upload-file'
                                onDragOver={event => event.preventDefault()}
                                onDrop={handleFileDrop}
                              >
                                <span className='cmc-upload-dropzone__motif' aria-hidden='true'>
                                  <span />
                                  <span />
                                  <span />
                                  <span />
                                  <span />
                                </span>
                                <span className='cmc-upload-dropzone__content'>
                                  <strong>{selectedFile?.name || 'Drop an MP3 file here'}</strong>
                                  <span>{selectedFile ? 'Click to choose a different file' : 'or click anywhere in this box to browse'}</span>
                                  <small>MP3 files only. The full track remains private while it is reviewed.</small>
                                </span>
                              </label>
                              <Form.Control
                                className='cmc-upload-file-input'
                                type='file'
                                required
                                name='file'
                                ref={ref}
                                onChange={handleFileChange}
                                isInvalid={!!errors.file}
                                accept='audio/mpeg,audio/mp3'
                              />
                              <Form.Control.Feedback type='invalid'>
                                {errors.file}
                              </Form.Control.Feedback>
                            </Form.Group>

                            <div className='cmc-upload-step-actions'>
                              <Button
                                type='button'
                                onClick={handleUploadAudio}
                              >
                                Upload audio
                              </Button>
                            </div>
                          </>
                        )}

                        {canShowUploadSummary && (
                          <div className={uploadingAudio ? 'cmc-upload-step-summary cmc-upload-step-summary--working' : 'cmc-upload-step-summary'}>
                            <div>
                              <strong>{uploadingAudio ? 'Uploading track' : 'Track uploaded'}</strong>
                              <span>{selectedFile?.name || 'Audio file ready'}</span>
                            </div>
                            {!uploadingAudio && (
                              <Button type='button' variant='subtle' onClick={backToUpload}>
                                Change file
                              </Button>
                            )}
                          </div>
                        )}

                        {canShowPreview && !previewConfirmed && (
                          <UploadPreviewSelector
                            audioUrl={audioUrl}
                            duration={audioDuration}
                            isConfirmed={previewConfirmed}
                            isLoading={uploadingAudio || waveformLoading}
                            previewStart={previewStart}
                            waveformPeaks={waveformPeaks}
                            onBack={backToUpload}
                            onConfirm={confirmPreview}
                            onSelectionChange={updatePreviewSelection}
                          />
                        )}

                        {previewConfirmed && (
                          <div className='cmc-upload-step-summary'>
                            <div>
                              <strong>Preview selected</strong>
                              <span>{formatSeconds(values.previewStart)} - {formatSeconds(values.previewEnd)}</span>
                            </div>
                            {!detailsConfirmed && (
                              <Button type='button' variant='subtle' onClick={backToPreview}>
                                Edit preview
                              </Button>
                            )}
                          </div>
                        )}

                        {canShowDetails && !detailsConfirmed && (
                          <section className='cmc-upload-step-section'>
                            <div className='cmc-upload-step-heading'>
                              <span>Catalogue details</span>
                              <h2>Describe the track</h2>
                              <p>These are the details musicians will use to find and assess the track.</p>
                            </div>

                            <div className='cmc-upload-field-grid'>
                              <Form.Group className='cmc-upload-field' controlId='upload-title'>
                                <Form.Label>Title</Form.Label>
                                <Form.Control
                                  type='text'
                                  placeholder='Title'
                                  name='title'
                                  value={values.title}
                                  onChange={event => {
                                    setDetailsConfirmed(false)
                                    setPricingConfirmed(false)
                                    handleChange(event)
                                  }}
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
                                  onChange={event => {
                                    setDetailsConfirmed(false)
                                    setPricingConfirmed(false)
                                    handleChange(event)
                                  }}
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
                                  onChange={event => {
                                    setDetailsConfirmed(false)
                                    setPricingConfirmed(false)
                                    handleChange(event)
                                  }}
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
                                  onChange={event => {
                                    setDetailsConfirmed(false)
                                    setPricingConfirmed(false)
                                    handleChange(event)
                                  }}
                                  isInvalid={!!errors.instrumentation}
                                />
                                <Form.Control.Feedback type='invalid'>
                                  {errors.instrumentation}
                                </Form.Control.Feedback>
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
                                onChange={event => {
                                  setDetailsConfirmed(false)
                                  setPricingConfirmed(false)
                                  handleChange(event)
                                }}
                                isInvalid={!!errors.additionalInfo}
                              />
                              <Form.Control.Feedback type='invalid'>
                                {errors.additionalInfo}
                              </Form.Control.Feedback>
                            </Form.Group>

                            <div className='cmc-upload-step-actions'>
                              <Button type='button' variant='subtle' onClick={backToPreview}>
                                Back
                              </Button>
                              <Button type='button' onClick={confirmDetails}>
                                {detailsConfirmed ? 'Details confirmed' : 'Confirm details'}
                              </Button>
                            </div>
                          </section>
                        )}

                        {detailsConfirmed && (
                          <div className='cmc-upload-step-summary'>
                            <div>
                              <strong>Details locked</strong>
                              <span>{values.title || 'Untitled'} by {values.composer || 'Unknown composer'}</span>
                            </div>
                            {!pricingConfirmed && (
                              <Button type='button' variant='subtle' onClick={backToDetails}>
                                Edit details
                              </Button>
                            )}
                          </div>
                        )}

                        {canShowPricing && !pricingConfirmed && (
                          <section className='cmc-upload-step-section'>
                            <div className='cmc-upload-step-heading'>
                              <span>Pricing</span>
                              <h2>Set a fair track price</h2>
                              <p>Price this individual uploaded track. Works & Collections can be created later by grouping approved tracks together.</p>
                            </div>

                            <Form.Group className='cmc-upload-field' controlId='upload-catalogue-type'>
                              <Form.Label>Track type</Form.Label>
                              <Form.Select
                                name='catalogueType'
                                value={values.catalogueType}
                                onChange={event => {
                                  const nextBand = getPricingBand(event.target.value)

                                  setPricingConfirmed(false)
                                  setFieldValue('catalogueType', event.target.value)
                                  setFieldValue('saleFormat', saleFormats.individual)
                                  setFieldValue('priceString', (nextBand.defaultPricePence / 100).toFixed(2))
                                  setFieldValue('pricingTier', nextBand.label)
                                  setFieldValue('pricingJustification', '')
                                }}
                                isInvalid={!!errors.catalogueType}
                              >
                                {atomicTrackCatalogueTypes.map(type => {
                                  const band = getPricingBand(type)

                                  return (
                                    <option key={type} value={type}>
                                      {trackTypeLabels[type] || band.label}
                                    </option>
                                  )
                                })}
                              </Form.Select>
                              <Form.Text>{pricingBand.description}</Form.Text>
                            </Form.Group>

                            <Form.Group className='cmc-upload-field' controlId='upload-price'>
                              <Form.Label>Buyer price</Form.Label>
                              <div className='cmc-upload-price-options' role='radiogroup' aria-label='Buyer price'>
                                {pricingBand.options.map(pricePence => (
                                  <Form.Check
                                    key={pricePence}
                                    id={`upload-price-${pricePence}`}
                                    type='radio'
                                    name='priceString'
                                    label={formatPricePence(pricePence)}
                                    value={(pricePence / 100).toFixed(2)}
                                    checked={selectedPricePence === pricePence}
                                    onChange={event => {
                                      setPricingConfirmed(false)
                                      setFieldValue('priceString', event.target.value)
                                      setFieldValue('pricingTier', `${pricingBand.label} ${formatPricePence(pricePence)}`)
                                    }}
                                    isInvalid={!!errors.priceString}
                                  />
                                ))}
                              </div>
                              {errors.priceString && (
                                <div className='invalid-feedback d-block'>
                                  {errors.priceString}
                                </div>
                              )}
                            </Form.Group>

                            <div className={needsPricingReview ? 'cmc-upload-pricing-note cmc-upload-pricing-note--review' : 'cmc-upload-pricing-note'}>
                              {needsPricingReview
                                ? 'This price is allowed, but it will be highlighted for admin review before publication.'
                                : 'This price sits inside the standard community pricing band for this track type.'}
                            </div>

                            {needsPricingReview && (
                              <Form.Group className='cmc-upload-field' controlId='upload-pricing-justification'>
                                <Form.Label>Pricing note</Form.Label>
                                <Form.Control
                                  as='textarea'
                                  rows={3}
                                  name='pricingJustification'
                                  placeholder='Briefly explain why this upload needs the higher price.'
                                  value={values.pricingJustification}
                                  onChange={event => {
                                    setPricingConfirmed(false)
                                    handleChange(event)
                                  }}
                                  isInvalid={!!errors.pricingJustification}
                                />
                              </Form.Group>
                            )}

                            <div className='cmc-upload-step-actions'>
                              <Button type='button' variant='subtle' onClick={backToDetails}>
                                Back
                              </Button>
                              <Button type='button' onClick={confirmPricing}>
                                {pricingConfirmed ? 'Price confirmed' : 'Confirm price'}
                              </Button>
                            </div>
                          </section>
                        )}

                        {pricingConfirmed && (
                          <div className='cmc-upload-step-summary'>
                            <div>
                              <strong>Price locked</strong>
                              <span>£{Number(values.priceString || 0).toFixed(2)}</span>
                            </div>
                            <Button type='button' variant='subtle' onClick={backToPricing}>
                              Edit price
                            </Button>
                          </div>
                        )}

                        {canShowTerms && (
                          <section className='cmc-upload-step-section'>
                            <div className='cmc-upload-step-heading'>
                              <span>Legal confirmation</span>
                              <h2>Confirm upload rights</h2>
                              <p>This acknowledgement is required before a track can be submitted for review.</p>
                            </div>

                            <div className='cmc-upload-terms-scroll' tabIndex={0}>
                              <p>
                                By submitting this track to Classical Music Catalogue, you confirm that you own
                                the recording or have the full legal authority to distribute it through this
                                platform.
                              </p>
                              <p>
                                You confirm that the uploaded audio, arrangement, accompaniment, performance,
                                edit, and any supplied notes do not infringe copyright, performer rights,
                                publishing rights, contractual restrictions, or any other third-party rights.
                              </p>
                              <p>
                                You understand that CMC may keep the submission private while it is reviewed,
                                may reject or remove a track if ownership or licensing is unclear, and may ask
                                for supporting information before publication.
                              </p>
                              <p>
                                You agree not to upload commercial recordings, unauthorised copies, extracted
                                backing tracks, or material from third-party libraries unless you have explicit
                                permission to sell that material through CMC.
                              </p>
                            </div>

                            <Form.Group className='cmc-upload-terms' controlId='upload-terms'>
                              <Form.Check
                                required
                                name='terms'
                                label='I have read and agree to the upload rights confirmation'
                                onChange={handleChange}
                                isInvalid={Boolean(errors.terms && !values.terms)}
                                feedback={!values.terms ? errors.terms : ''}
                                feedbackType='invalid'
                                id='upload-terms-check'
                              />
                            </Form.Group>

                            <div className='cmc-upload-step-actions'>
                              <Button type='button' variant='subtle' onClick={backToPricing}>
                                Back
                              </Button>
                            </div>
                          </section>
                        )}
                      </div>

                      {canShowTerms && (
                        <div className='cmc-upload-submit'>
                          <Button size='lg' type='submit' disabled={isSubmitting || !isReadyToSubmit}>
                            {isSubmitting ? 'Uploading...' : 'Submit'}
                          </Button>
                        </div>
                      )}
                    </Panel>
                  </section>
                </div>
              </main>
              </Form>
            )
          }}
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
                  {activeUploadBatch ? (
                    <>
                      <p>
                        Your track has been uploaded as a draft and attached to
                        {` ${activeUploadBatch.label || `upload batch #${activeUploadBatch.id}`}`}.
                      </p>
                      <p className='mb-0'>
                        You can add another related track to this batch now, or move to upload management to review the batch.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        Your track has been uploaded as a draft and is now waiting
                        for review. It will not appear in the public catalogue until
                        it has been checked and approved.
                      </p>
                      <p className='mb-0'>
                        You can upload another track now, return to the catalogue,
                        or open the admin console to review pending submissions.
                      </p>
                    </>
                  )}
                </div>
                <div className='modal-footer'>
                  <Button variant='subtle' onClick={uploadAnotherTrack}>
                    {activeUploadBatch ? 'Add Another to Batch' : 'Upload Another'}
                  </Button>
                  {activeUploadBatch && (
                    <Button as={Link} href='/upload/manage' variant='secondary'>
                      Manage Uploads
                    </Button>
                  )}
                  <Button as={Link} href='/catalogue' variant='secondary'>
                    Catalogue
                  </Button>
                  <Button as={Link} href='/admin'>
                    Review Submissions
                  </Button>
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
          <Panel as='section' className='cmc-upload-auth-panel'>
            <UploadPageTitle />
            <p>Your account must be active before you can submit tracks.</p>
            <Button as={Link} href='/profile' variant='secondary'>
              Go to Profile
            </Button>
          </Panel>
        </div>
      </main>
    )
  } else {
    return (
      <main className='cmc-upload-page'>
        <div className='container'>
          <Panel as='section' className='cmc-upload-auth-panel'>
            <UploadPageTitle />
            <p>You must be logged in to upload a track.</p>
            <Button as={Link} href='/login'>
              Sign In
            </Button>
          </Panel>
        </div>
      </main>
    )
  }
}

export default UploadForm
