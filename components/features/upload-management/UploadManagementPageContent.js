'use client'

import { memo, useState } from 'react'
import Link from 'next/link'
import { Layers3, UploadCloud } from 'lucide-react'
import BrandDisplayText from '../../brand/BrandDisplayText'
import { Button } from '../../ui/primitives'
import {
  catalogueTypes,
  formatPricePence,
  getPricingBand,
  saleFormats,
  worksAndCollectionsCatalogueTypes,
  worksAndCollectionsTypeLabels
} from '../../../lib/pricing-policy.mjs'

const formatCollectionDate = value => {
  if (!value || !String(value).includes('T')) {
    return value || 'today'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value))
}

const worksSaleFormatLabels = {
  [saleFormats.bundle]: 'Collection only',
  [saleFormats.both]: 'Collection and individual tracks'
}

const getDisplayName = user => user.name || user.email || 'CMC member'

const batchStatusLabels = {
  DRAFT: 'Draft',
  UPLOADING: 'Uploading',
  READY_FOR_REVIEW: 'Ready for review',
  SUBMITTED: 'Submitted',
  PARTIALLY_FAILED: 'Needs attention',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived'
}

const resumableBatchStatuses = new Set([
  'DRAFT',
  'UPLOADING',
  'READY_FOR_REVIEW',
  'PARTIALLY_FAILED'
])

const formatBatchDate = value => {
  if (!value) {
    return 'Not submitted'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value))
}

const WorksCollectionsManager = ({ collections, onCreated, tracks }) => {
  const [catalogueType, setCatalogueType] = useState(catalogueTypes.collection)
  const [composer, setComposer] = useState('')
  const [error, setError] = useState('')
  const [pricePence, setPricePence] = useState(getPricingBand(catalogueTypes.collection).defaultPricePence)
  const [pricingJustification, setPricingJustification] = useState('')
  const [saleFormat, setSaleFormat] = useState(saleFormats.both)
  const [selectedTrackIds, setSelectedTrackIds] = useState([])
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [deletingCollectionId, setDeletingCollectionId] = useState(null)

  const pricingBand = getPricingBand(catalogueType)
  const needsPricingReview = pricePence > pricingBand.reviewThresholdPence
  const canCreate = selectedTrackIds.length >= 2 && title.trim() && !submitting

  const handleTypeChange = event => {
    const nextType = event.target.value
    const nextBand = getPricingBand(nextType)

    setCatalogueType(nextType)
    setPricePence(nextBand.defaultPricePence)
    setPricingJustification('')
  }

  const toggleTrack = trackId => {
    setSelectedTrackIds(currentIds => (
      currentIds.includes(trackId)
        ? currentIds.filter(id => id !== trackId)
        : [...currentIds, trackId]
    ))
  }

  const resetForm = () => {
    setComposer('')
    setPricingJustification('')
    setSelectedTrackIds([])
    setTitle('')
  }

  const submitCollection = async event => {
    event.preventDefault()
    setError('')
    setStatus('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/works-collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catalogueType,
          composer: composer.trim() || undefined,
          pricePence,
          pricingJustification: pricingJustification.trim() || undefined,
          saleFormat,
          title: title.trim(),
          trackIds: selectedTrackIds
        })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to create Work or Collection')
      }

      onCreated(data.collection)
      resetForm()
      setStatus('Work or Collection created.')
    } catch (createError) {
      setError(createError.message || 'Unable to create Work or Collection')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteCollection = async collection => {
    setError('')
    setStatus('')
    setDeletingCollectionId(collection.id)

    try {
      const response = await fetch(`/api/works-collections/${collection.id}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete Work or Collection')
      }

      onCreated(null, {
        deleteId: collection.id
      })
      setStatus('Work or Collection removed.')
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete Work or Collection')
    } finally {
      setDeletingCollectionId(null)
    }
  }

  return (
    <section className='cmc-profile-works cmc-upload-management-works' aria-labelledby='upload-management-works-heading'>
      <div className='cmc-profile-section-heading'>
        <div>
          <p className='cmc-profile-kicker'>Works & Collections</p>
          <h2 id='upload-management-works-heading'>Group Approved Tracks</h2>
        </div>
        <p>{collections.length} created</p>
      </div>

      <div className='cmc-profile-works-grid'>
        <form className='cmc-profile-works-form' onSubmit={submitCollection}>
          <div className='cmc-profile-works-fields'>
            <label>
              <span>Title</span>
              <input
                maxLength={255}
                onChange={event => setTitle(event.target.value)}
                placeholder='e.g. Schubert rehearsal selections'
                required
                type='text'
                value={title}
              />
            </label>
            <label>
              <span>Composer</span>
              <input
                maxLength={255}
                onChange={event => setComposer(event.target.value)}
                placeholder='Optional'
                type='text'
                value={composer}
              />
            </label>
            <label>
              <span>Type</span>
              <select value={catalogueType} onChange={handleTypeChange}>
                {worksAndCollectionsCatalogueTypes.map(type => (
                  <option key={type} value={type}>
                    {worksAndCollectionsTypeLabels[type]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Sale format</span>
              <select value={saleFormat} onChange={event => setSaleFormat(event.target.value)}>
                {[saleFormats.both, saleFormats.bundle].map(format => (
                  <option key={format} value={format}>
                    {worksSaleFormatLabels[format]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className='cmc-profile-works-track-picker'>
            <legend>Choose tracks</legend>
            {tracks.length === 0 ? (
              <p>Approved uploaded tracks will appear here after review.</p>
            ) : tracks.map(track => (
              <label key={track.id}>
                <input
                  checked={selectedTrackIds.includes(track.id)}
                  onChange={() => toggleTrack(track.id)}
                  type='checkbox'
                  value={track.id}
                />
                <span>{track.title}</span>
                <small>{track.composer || 'Unknown composer'}</small>
              </label>
            ))}
          </fieldset>

          <fieldset className='cmc-profile-works-price'>
            <legend>Collection price</legend>
            <div>
              {pricingBand.options.map(optionPricePence => (
                <label
                  className={pricePence === optionPricePence ? 'cmc-profile-works-price-option cmc-profile-works-price-option--selected' : 'cmc-profile-works-price-option'}
                  key={optionPricePence}
                >
                  <input
                    checked={pricePence === optionPricePence}
                    onChange={() => setPricePence(optionPricePence)}
                    type='radio'
                    value={optionPricePence}
                  />
                  <span>{formatPricePence(optionPricePence)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {needsPricingReview && (
            <label className='cmc-profile-works-note'>
              <span>Pricing note</span>
              <textarea
                maxLength={2000}
                onChange={event => setPricingJustification(event.target.value)}
                placeholder='Optional note for admin review'
                rows={3}
                value={pricingJustification}
              />
            </label>
          )}

          {error && <div className='cmc-profile-notice cmc-profile-notice--error' role='alert'>{error}</div>}
          {status && <div className='cmc-profile-notice cmc-profile-notice--success' role='status'>{status}</div>}

          <div className='cmc-profile-works-actions'>
            <span>{selectedTrackIds.length} selected</span>
            <Button disabled={!canCreate} type='submit' variant='ink'>
              {submitting ? 'Creating...' : 'Create Work or Collection'}
            </Button>
          </div>
        </form>

        <aside className='cmc-profile-works-list' aria-label='Created Works and Collections'>
          <h3>Created</h3>
          {collections.length === 0 ? (
            <p>Approved uploaded tracks can be grouped here once you have at least two related items.</p>
          ) : (
            <ul>
              {collections.map(collection => (
                <li key={collection.id}>
                  <div>
                    <strong>{collection.title}</strong>
                    <span>{worksAndCollectionsTypeLabels[collection.catalogueType] || 'Collection'} · {collection.formattedPrice}</span>
                    <small>{collection.tracks.length} tracks · Created {formatCollectionDate(collection.createdAt)}</small>
                  </div>
                  <Button
                    aria-label={`Delete ${collection.title}`}
                    disabled={deletingCollectionId === collection.id}
                    onClick={() => deleteCollection(collection)}
                    size='sm'
                    type='button'
                    variant='subtle'
                  >
                    {deletingCollectionId === collection.id ? 'Removing...' : 'Remove'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </section>
  )
}

const UploadManagementPageContent = ({
  currentUser,
  userUploadBatches = [],
  userUploadedTracks,
  userWorksCollections = []
}) => {
  const [uploadBatches, setUploadBatches] = useState(userUploadBatches)
  const [worksCollections, setWorksCollections] = useState(userWorksCollections)
  const [batchStatusMessage, setBatchStatusMessage] = useState('')
  const [batchError, setBatchError] = useState('')
  const [submittingBatchId, setSubmittingBatchId] = useState(null)

  const submitBatch = async batch => {
    setBatchError('')
    setBatchStatusMessage('')
    setSubmittingBatchId(batch.id)

    try {
      const response = await fetch(`/api/upload-batches/${batch.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'SUBMITTED'
        })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit upload batch')
      }

      setUploadBatches(currentBatches => currentBatches.map(currentBatch => (
        currentBatch.id === batch.id ? data.batch : currentBatch
      )))
      setBatchStatusMessage('Upload batch submitted.')
    } catch (error) {
      setBatchError(error.message || 'Unable to submit upload batch')
    } finally {
      setSubmittingBatchId(null)
    }
  }

  return (
    <main className='cmc-profile-page cmc-upload-management-page'>
      <div className='container'>
        <section className='cmc-profile-board' aria-labelledby='upload-management-heading'>
          <header className='cmc-profile-header cmc-upload-management-header'>
            <div className='cmc-profile-staff' aria-hidden='true' />
            <div className='cmc-profile-paper' aria-hidden='true' />
            <div className='cmc-profile-heading'>
              <p className='cmc-profile-kicker'>Uploader Workspace</p>
              <h1 id='upload-management-heading'>
                <BrandDisplayText text='Manage Uploads.' />
              </h1>
              <p>
                Organise approved tracks into Works and Collections, prepare related releases, and keep uploaded catalogue management separate from your personal library.
              </p>
            </div>
            <aside className='cmc-profile-identity cmc-upload-management-summary' aria-label='Upload management summary'>
              <Layers3 aria-hidden='true' strokeWidth={1.7} />
              <div>
                <h2>{getDisplayName(currentUser)}</h2>
                <p>{currentUser.email}</p>
              </div>
              <dl>
                <div>
                  <dt>Approved Tracks</dt>
                  <dd>{userUploadedTracks.length}</dd>
                </div>
                <div>
                  <dt>Collections</dt>
                  <dd>{worksCollections.length}</dd>
                </div>
              </dl>
            </aside>
          </header>

          <section className='cmc-profile-role-panel cmc-profile-role-panel--uploader cmc-upload-management-intro' aria-label='Upload management actions'>
            <UploadCloud aria-hidden='true' strokeWidth={1.7} />
            <div>
              <p className='cmc-profile-kicker'>Catalogue operations</p>
              <h2>Build releases from approved tracks</h2>
              <p>
                Upload single tracks first, then group related approved tracks into buyer-facing Works and Collections here. Bulk upload and batch review will extend this workspace next.
              </p>
              <div className='cmc-profile-role-actions'>
                <Button as={Link} href='/upload' variant='ink'>
                  Upload tracks
                </Button>
                <Button as={Link} href='/profile?library=uploads' variant='paper'>
                  View upload reporting
                </Button>
              </div>
            </div>
          </section>

          <WorksCollectionsManager
            collections={worksCollections}
            onCreated={(collection, action = {}) => setWorksCollections(currentCollections => {
              if (action.deleteId) {
                return currentCollections.filter(currentCollection => currentCollection.id !== action.deleteId)
              }

              return [collection, ...currentCollections]
            })}
            tracks={userUploadedTracks}
          />

          <section className='cmc-upload-management-batches' aria-labelledby='upload-management-batches-heading'>
            <div className='cmc-profile-section-heading'>
              <div>
                <p className='cmc-profile-kicker'>Bulk upload</p>
                <h2 id='upload-management-batches-heading'>Upload Batches</h2>
              </div>
              <p>{uploadBatches.length} batches</p>
            </div>

            {batchError && <div className='cmc-profile-notice cmc-profile-notice--error' role='alert'>{batchError}</div>}
            {batchStatusMessage && <div className='cmc-profile-notice cmc-profile-notice--success' role='status'>{batchStatusMessage}</div>}

            {uploadBatches.length === 0 ? (
              <div className='cmc-upload-management-empty'>
                <h3>No batch uploads yet</h3>
                <p>
                  Future multi-file uploads will appear here with their review progress, failed files, and the tracks created from each import.
                </p>
              </div>
            ) : (
              <ul className='cmc-upload-management-batch-list'>
                {uploadBatches.map(batch => (
                  <li key={batch.id}>
                    <div>
                      <strong>{batch.label || `Upload batch #${batch.id}`}</strong>
                      <span>{batchStatusLabels[batch.status] || batch.status} · Created {formatBatchDate(batch.createdAt)}</span>
                    </div>
                    <dl>
                      <div>
                        <dt>Tracks</dt>
                        <dd>{batch.summary.totalTracks}</dd>
                      </div>
                      <div>
                        <dt>Ready</dt>
                        <dd>{batch.summary.readyTracks}</dd>
                      </div>
                      <div>
                        <dt>Review</dt>
                        <dd>{batch.summary.pendingReviewTracks}</dd>
                      </div>
                      <div>
                        <dt>Failed</dt>
                        <dd>{batch.summary.failedTracks}</dd>
                      </div>
                    </dl>
                    <div className='cmc-upload-management-batch-actions'>
                      <Button as={Link} href={`/upload/manage/${batch.id}`} variant='subtle'>
                        View batch
                      </Button>
                      {resumableBatchStatuses.has(batch.status) && (
                        <>
                        <Button as={Link} href={`/upload?batchId=${batch.id}`} variant='paper'>
                          Continue batch
                        </Button>
                        <Button
                          disabled={submittingBatchId === batch.id}
                          onClick={() => submitBatch(batch)}
                          type='button'
                          variant='ink'
                        >
                          {submittingBatchId === batch.id ? 'Submitting...' : 'Submit batch'}
                        </Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}

export default memo(UploadManagementPageContent)
