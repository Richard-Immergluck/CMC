'use client'

import { memo, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, Layers3, Pencil, Search, UploadCloud, X } from 'lucide-react'
import BrandDisplayText from '../../brand/BrandDisplayText'
import { Button } from '../../ui/primitives'
import {
  filterUploadInventoryCollections,
  filterUploadInventoryTracks,
  getUploadInventorySearchQuery
} from '../../../lib/upload-management-inventory.mjs'
import {
  atomicTrackCatalogueTypes,
  catalogueTypes,
  formatPricePence,
  getPricingBand,
  saleFormats,
  worksAndCollectionsCatalogueTypes,
  worksAndCollectionsTypeLabels
} from '../../../lib/pricing-policy.mjs'
import {
  getUploadBatchSubmitBlocker,
  maxUploadBatchTracks
} from '../../../lib/upload-batch-policy.mjs'
import {
  canEditWorksCollection,
  catalogueReleaseStatusDescriptions,
  catalogueReleaseStatusLabels
} from '../../../lib/server/works-collections-core.mjs'

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

const canSubmitUploadBatch = batch => getUploadBatchSubmitBlocker(batch.summary) === ''

const getTrackMembershipSummary = track => {
  const memberships = track.collectionMemberships || []

  if (memberships.length === 0) {
    return ''
  }

  const firstMembership = memberships[0]
  const extraCount = memberships.length - 1

  return extraCount > 0
    ? `${firstMembership.collectionTitle} + ${extraCount} more`
    : firstMembership.collectionTitle
}

const batchDefaultPriceOptions = Array.from(new Set(
  atomicTrackCatalogueTypes.flatMap(type => getPricingBand(type).options)
)).sort((firstPrice, secondPrice) => firstPrice - secondPrice)

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

const getTrackMetadataDraft = track => ({
  additionalInfo: track.additionalInfo || '',
  composer: track.composer || '',
  downloadName: track.downloadName || '',
  instrumentation: track.instrumentation || '',
  key: track.key || '',
  title: track.title || ''
})

const UploadedTracksManager = ({ onTrackUpdated, tracks }) => {
  const [draft, setDraft] = useState(null)
  const [editingTrackId, setEditingTrackId] = useState(null)
  const [error, setError] = useState('')
  const [savingTrackId, setSavingTrackId] = useState(null)
  const [status, setStatus] = useState('')
  const [trackSearch, setTrackSearch] = useState('')

  const normalizedTrackSearch = getUploadInventorySearchQuery(trackSearch)
  const filteredTracks = useMemo(() => filterUploadInventoryTracks({
    query: normalizedTrackSearch,
    tracks
  }), [normalizedTrackSearch, tracks])

  const startEditingTrack = track => {
    setDraft(getTrackMetadataDraft(track))
    setEditingTrackId(track.id)
    setError('')
    setStatus('')
  }

  const cancelEditingTrack = () => {
    setDraft(null)
    setEditingTrackId(null)
  }

  const updateDraft = (field, value) => {
    setDraft(currentDraft => ({
      ...(currentDraft || {}),
      [field]: value
    }))
  }

  const saveTrackMetadata = async track => {
    setError('')
    setStatus('')
    setSavingTrackId(track.id)

    try {
      const response = await fetch(`/api/tracks/${track.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          additionalInfo: draft.additionalInfo.trim() || undefined,
          composer: draft.composer.trim() || undefined,
          downloadName: draft.downloadName.trim(),
          instrumentation: draft.instrumentation.trim() || undefined,
          key: draft.key.trim() || undefined,
          title: draft.title.trim() || undefined
        })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update track metadata')
      }

      onTrackUpdated(data)
      setStatus(`${data.title || track.title} updated.`)
      cancelEditingTrack()
    } catch (saveError) {
      setError(saveError.message || 'Unable to update track metadata')
    } finally {
      setSavingTrackId(null)
    }
  }

  return (
    <section className='cmc-upload-management-tracks' aria-labelledby='upload-management-tracks-heading'>
      <div className='cmc-profile-section-heading'>
        <div>
          <p className='cmc-profile-kicker'>Uploaded tracks</p>
          <h2 id='upload-management-tracks-heading'>Manage Track Metadata</h2>
        </div>
        <p>{filteredTracks.length} of {tracks.length}</p>
      </div>

      <div className='cmc-upload-management-search'>
        <Search aria-hidden='true' size={18} />
        <label htmlFor='uploaded-track-search'>Search uploaded tracks</label>
        <input
          id='uploaded-track-search'
          onChange={event => setTrackSearch(event.target.value)}
          placeholder='Search title, composer, key, filename, notes...'
          type='search'
          value={trackSearch}
        />
        {trackSearch && (
          <button
            aria-label='Clear uploaded track search'
            onClick={() => setTrackSearch('')}
            type='button'
          >
            <X aria-hidden='true' size={18} />
          </button>
        )}
      </div>

      {error && <div className='cmc-profile-notice cmc-profile-notice--error' role='alert'>{error}</div>}
      {status && <div className='cmc-profile-notice cmc-profile-notice--success' role='status'>{status}</div>}

      {tracks.length === 0 ? (
        <div className='cmc-upload-management-empty'>
          <h3>No approved tracks yet</h3>
          <p>Approved uploads will appear here for metadata upkeep once review is complete.</p>
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className='cmc-upload-management-empty'>
          <h3>No tracks found</h3>
          <p>No approved uploaded tracks match that search.</p>
        </div>
      ) : (
        <ul className='cmc-upload-management-track-list'>
          {filteredTracks.map(track => {
            const isEditing = editingTrackId === track.id
            const membershipSummary = getTrackMembershipSummary(track)

            return (
              <li key={track.id}>
                <div className='cmc-upload-management-track-main'>
                  <strong>{track.title}</strong>
                  <span>{track.composer || 'Unknown composer'} · {track.key || 'Key not set'} · {track.instrumentation || 'Instrumentation not set'}</span>
                  {membershipSummary && (
                    <small className='cmc-upload-management-membership'>
                      Part of {membershipSummary}
                    </small>
                  )}
                </div>
                <dl className='cmc-upload-management-track-stats'>
                  <div>
                    <dt>Price</dt>
                    <dd>{track.formattedPrice || formatPricePence(track.pricePence || 0)}</dd>
                  </div>
                  <div>
                    <dt>Comments</dt>
                    <dd>{track.commentCount || 0}</dd>
                  </div>
                  <div>
                    <dt>Requests</dt>
                    <dd>{track.requestCount || 0}</dd>
                  </div>
                </dl>
                <div className='cmc-upload-management-track-actions'>
                  <Button
                    disabled={Boolean(editingTrackId) && !isEditing}
                    onClick={() => startEditingTrack(track)}
                    type='button'
                    variant='paper'
                  >
                    <Pencil aria-hidden='true' size={16} />
                    Edit metadata
                  </Button>
                  <Button as={Link} href={`/tracks/${track.id}`} variant='subtle'>
                    Details
                  </Button>
                </div>

                {isEditing && draft && (
                  <form
                    className='cmc-upload-management-track-edit-form'
                    onSubmit={event => {
                      event.preventDefault()
                      saveTrackMetadata(track)
                    }}
                  >
                    <label>
                      <span>Title</span>
                      <input
                        maxLength={255}
                        onChange={event => updateDraft('title', event.target.value)}
                        required
                        type='text'
                        value={draft.title}
                      />
                    </label>
                    <label>
                      <span>Composer</span>
                      <input
                        maxLength={255}
                        onChange={event => updateDraft('composer', event.target.value)}
                        required
                        type='text'
                        value={draft.composer}
                      />
                    </label>
                    <label>
                      <span>Key</span>
                      <input
                        maxLength={255}
                        onChange={event => updateDraft('key', event.target.value)}
                        required
                        type='text'
                        value={draft.key}
                      />
                    </label>
                    <label>
                      <span>Instrumentation</span>
                      <input
                        maxLength={255}
                        onChange={event => updateDraft('instrumentation', event.target.value)}
                        required
                        type='text'
                        value={draft.instrumentation}
                      />
                    </label>
                    <label>
                      <span>Download filename</span>
                      <input
                        maxLength={255}
                        onChange={event => updateDraft('downloadName', event.target.value)}
                        placeholder='Optional buyer-facing filename'
                        type='text'
                        value={draft.downloadName}
                      />
                    </label>
                    <label className='cmc-upload-management-track-edit-form-notes'>
                      <span>Additional notes</span>
                      <textarea
                        maxLength={2000}
                        onChange={event => updateDraft('additionalInfo', event.target.value)}
                        rows={4}
                        value={draft.additionalInfo}
                      />
                    </label>
                    <div className='cmc-upload-management-track-edit-actions'>
                      <Button disabled={savingTrackId === track.id} type='submit' variant='ink'>
                        {savingTrackId === track.id ? 'Saving...' : 'Save metadata'}
                      </Button>
                      <Button disabled={savingTrackId === track.id} onClick={cancelEditingTrack} type='button' variant='subtle'>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

const WorksCollectionsManager = ({ collections, onCreated, tracks }) => {
  const [catalogueType, setCatalogueType] = useState(catalogueTypes.collection)
  const [collectionSearch, setCollectionSearch] = useState('')
  const [composer, setComposer] = useState('')
  const [editingCollectionId, setEditingCollectionId] = useState(null)
  const [error, setError] = useState('')
  const [pricePence, setPricePence] = useState(getPricingBand(catalogueTypes.collection).defaultPricePence)
  const [pricingJustification, setPricingJustification] = useState('')
  const [saleFormat, setSaleFormat] = useState(saleFormats.both)
  const [selectedTrackItems, setSelectedTrackItems] = useState([])
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [deletingCollectionId, setDeletingCollectionId] = useState(null)
  const [trackSearch, setTrackSearch] = useState('')

  const pricingBand = getPricingBand(catalogueType)
  const needsPricingReview = pricePence > pricingBand.reviewThresholdPence
  const selectedTrackIds = selectedTrackItems.map(item => item.trackId)
  const canSave = selectedTrackItems.length >= 2 && title.trim() && !submitting
  const normalizedCollectionSearch = getUploadInventorySearchQuery(collectionSearch)
  const normalizedTrackSearch = getUploadInventorySearchQuery(trackSearch)
  const filteredCollections = useMemo(() => filterUploadInventoryCollections({
    collections,
    query: normalizedCollectionSearch
  }), [collections, normalizedCollectionSearch])
  const filteredTracks = useMemo(() => filterUploadInventoryTracks({
    query: normalizedTrackSearch,
    tracks
  }), [normalizedTrackSearch, tracks])

  const handleTypeChange = event => {
    const nextType = event.target.value
    const nextBand = getPricingBand(nextType)

    setCatalogueType(nextType)
    setPricePence(nextBand.defaultPricePence)
    setPricingJustification('')
  }

  const toggleTrack = trackId => {
    const track = tracks.find(candidateTrack => candidateTrack.id === trackId)

    setSelectedTrackItems(currentItems => (
      currentItems.some(item => item.trackId === trackId)
        ? currentItems.filter(item => item.trackId !== trackId)
        : [
          ...currentItems,
          {
            movementNo: '',
            titleInWork: track?.title || '',
            trackId
          }
        ]
    ))
  }

  const moveSelectedTrack = (trackId, direction) => {
    setSelectedTrackItems(currentItems => {
      const currentIndex = currentItems.findIndex(item => item.trackId === trackId)
      const nextIndex = currentIndex + direction

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentItems.length) {
        return currentItems
      }

      const nextItems = [...currentItems]
      const [item] = nextItems.splice(currentIndex, 1)
      nextItems.splice(nextIndex, 0, item)

      return nextItems
    })
  }

  const updateSelectedTrackTitle = (trackId, titleInWork) => {
    setSelectedTrackItems(currentItems => currentItems.map(item => (
      item.trackId === trackId
        ? {
          ...item,
          titleInWork
        }
        : item
    )))
  }

  const updateSelectedTrackMovement = (trackId, movementNo) => {
    setSelectedTrackItems(currentItems => currentItems.map(item => (
      item.trackId === trackId
        ? {
          ...item,
          movementNo
        }
        : item
    )))
  }

  const resetForm = () => {
    setComposer('')
    setEditingCollectionId(null)
    setPricingJustification('')
    setSelectedTrackItems([])
    setTitle('')
  }

  const startEditingCollection = collection => {
    const nextBand = getPricingBand(collection.catalogueType)

    setCatalogueType(collection.catalogueType)
    setComposer(collection.composer || '')
    setEditingCollectionId(collection.id)
    setError('')
    setPricePence(collection.pricePence || nextBand.defaultPricePence)
    setPricingJustification('')
    setSaleFormat(collection.saleFormat || saleFormats.both)
    setSelectedTrackItems(collection.tracks.map(track => ({
      movementNo: track.movementNo || '',
      titleInWork: track.titleInWork || track.title || '',
      trackId: track.trackId
    })))
    setStatus('')
    setTitle(collection.title)
  }

  const cancelEditingCollection = () => {
    const nextBand = getPricingBand(catalogueTypes.collection)

    resetForm()
    setCatalogueType(catalogueTypes.collection)
    setPricePence(nextBand.defaultPricePence)
    setSaleFormat(saleFormats.both)
  }

  const submitCollection = async event => {
    event.preventDefault()
    setError('')
    setStatus('')
    setSubmitting(true)

    try {
      const response = await fetch(editingCollectionId ? `/api/works-collections/${editingCollectionId}` : '/api/works-collections', {
        method: editingCollectionId ? 'PATCH' : 'POST',
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
          trackItems: selectedTrackItems.map((item, index) => ({
            movementNo: item.movementNo.trim() || undefined,
            position: index + 1,
            titleInWork: item.titleInWork.trim() || undefined,
            trackId: item.trackId
          }))
        })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to save Work or Collection')
      }

      onCreated(data.collection, editingCollectionId ? { replaceId: editingCollectionId } : {})
      resetForm()
      setStatus(editingCollectionId ? 'Work or Collection updated.' : 'Work or Collection created.')
    } catch (createError) {
      setError(createError.message || 'Unable to save Work or Collection')
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

      if (data.archived && data.collection) {
        onCreated(data.collection, {
          replaceId: collection.id
        })
        setStatus('Work or Collection archived. Existing buyer library access is preserved.')
      } else {
        onCreated(null, {
          deleteId: collection.id
        })
        setStatus('Work or Collection removed.')
      }
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
          {editingCollectionId && (
            <div className='cmc-profile-notice cmc-profile-notice--info' role='status'>
              Editing an existing Work or Collection. Save changes to update the release.
            </div>
          )}
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
            <div className='cmc-upload-management-inventory-heading'>
              <legend>Choose tracks</legend>
              <span>{filteredTracks.length} of {tracks.length} tracks</span>
            </div>
            <div className='cmc-upload-management-search'>
              <Search aria-hidden='true' size={18} />
              <label htmlFor='works-track-search'>Search approved tracks</label>
              <input
                id='works-track-search'
                onChange={event => setTrackSearch(event.target.value)}
                placeholder='Search title, composer, key, collection...'
                type='search'
                value={trackSearch}
              />
              {trackSearch && (
                <button
                  aria-label='Clear approved track search'
                  onClick={() => setTrackSearch('')}
                  type='button'
                >
                  <X aria-hidden='true' size={18} />
                </button>
              )}
            </div>
            {tracks.length === 0 ? (
              <p>Approved uploaded tracks will appear here after review.</p>
            ) : filteredTracks.length === 0 ? (
              <p>No approved tracks match that search.</p>
            ) : filteredTracks.map(track => {
              const membershipSummary = getTrackMembershipSummary(track)

              return (
                <label key={track.id}>
                  <input
                    checked={selectedTrackIds.includes(track.id)}
                    onChange={() => toggleTrack(track.id)}
                    type='checkbox'
                    value={track.id}
                  />
                  <span>
                    {track.title}
                    {membershipSummary && (
                      <small className='cmc-upload-management-membership'>
                        Part of {membershipSummary}
                      </small>
                    )}
                  </span>
                  <small>
                    {track.composer || 'Unknown composer'} · {track.formattedPrice || formatPricePence(track.pricePence || 0)}
                  </small>
                </label>
              )
            })}
          </fieldset>

          {selectedTrackItems.length > 0 && (
            <section className='cmc-profile-works-selected' aria-labelledby='works-selected-tracks-heading'>
              <div className='cmc-profile-works-selected-heading'>
                <h3 id='works-selected-tracks-heading'>Release order</h3>
                <p>{selectedTrackItems.length} tracks selected</p>
              </div>
              <ol>
                {selectedTrackItems.map((item, index) => {
                  const track = tracks.find(candidateTrack => candidateTrack.id === item.trackId)

                  return (
                    <li key={item.trackId}>
                      <span className='cmc-profile-works-selected-position'>{index + 1}</span>
                      <label>
                        <span>{track?.title || 'Selected track'}</span>
                        <input
                          maxLength={255}
                          onChange={event => updateSelectedTrackTitle(item.trackId, event.target.value)}
                          placeholder='Display title inside this Work or Collection'
                          type='text'
                          value={item.titleInWork}
                        />
                      </label>
                      <label>
                        <span>Movement / section</span>
                        <input
                          maxLength={80}
                          onChange={event => updateSelectedTrackMovement(item.trackId, event.target.value)}
                          placeholder='e.g. II, No. 4, Act I'
                          type='text'
                          value={item.movementNo}
                        />
                      </label>
                      <div className='cmc-profile-works-selected-actions'>
                        <Button
                          aria-label={`Move ${track?.title || 'track'} up`}
                          disabled={index === 0}
                          onClick={() => moveSelectedTrack(item.trackId, -1)}
                          size='sm'
                          type='button'
                          variant='subtle'
                        >
                          <ArrowUp aria-hidden='true' size={16} />
                        </Button>
                        <Button
                          aria-label={`Move ${track?.title || 'track'} down`}
                          disabled={index === selectedTrackItems.length - 1}
                          onClick={() => moveSelectedTrack(item.trackId, 1)}
                          size='sm'
                          type='button'
                          variant='subtle'
                        >
                          <ArrowDown aria-hidden='true' size={16} />
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}

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
            <span>{selectedTrackItems.length} selected</span>
            {editingCollectionId && (
              <Button disabled={submitting} type='button' variant='subtle' onClick={cancelEditingCollection}>
                Cancel edit
              </Button>
            )}
            <Button disabled={!canSave} type='submit' variant='ink'>
              {submitting
                ? 'Saving...'
                : editingCollectionId ? 'Save Work or Collection' : 'Create Work or Collection'}
            </Button>
          </div>
        </form>

        <aside className='cmc-profile-works-list' aria-label='Created Works and Collections'>
          <div className='cmc-upload-management-list-heading'>
            <h3>Created</h3>
            <span>{filteredCollections.length} of {collections.length}</span>
          </div>
          <div className='cmc-upload-management-search cmc-upload-management-search--compact'>
            <Search aria-hidden='true' size={18} />
            <label htmlFor='works-collection-search'>Search Works and Collections</label>
            <input
              id='works-collection-search'
              onChange={event => setCollectionSearch(event.target.value)}
              placeholder='Search releases, status, tracks...'
              type='search'
              value={collectionSearch}
            />
            {collectionSearch && (
              <button
                aria-label='Clear Works and Collections search'
                onClick={() => setCollectionSearch('')}
                type='button'
              >
                <X aria-hidden='true' size={18} />
              </button>
            )}
          </div>
          {collections.length === 0 ? (
            <p>Approved uploaded tracks can be grouped here once you have at least two related items.</p>
          ) : filteredCollections.length === 0 ? (
            <p>No Works or Collections match that search.</p>
          ) : (
            <ul>
              {filteredCollections.map(collection => (
                <li key={collection.id}>
                  <div>
                    <strong>{collection.title}</strong>
                    <span>{worksAndCollectionsTypeLabels[collection.catalogueType] || 'Collection'} · {collection.formattedPrice}</span>
                    <small>
                      {collection.tracks.length} tracks · Created {formatCollectionDate(collection.createdAt)} · {catalogueReleaseStatusLabels[collection.status] || collection.status}
                    </small>
                    {catalogueReleaseStatusDescriptions[collection.status] && (
                      <small>{catalogueReleaseStatusDescriptions[collection.status]}</small>
                    )}
                  </div>
                  <div className='cmc-profile-works-list-actions'>
                    <Button
                      as={Link}
                      href={`/upload/manage/works/${collection.id}`}
                      size='sm'
                      variant='subtle'
                    >
                      View
                    </Button>
                    <Button
                      aria-label={`Edit ${collection.title}`}
                      disabled={deletingCollectionId === collection.id || !canEditWorksCollection(collection)}
                      onClick={() => startEditingCollection(collection)}
                      size='sm'
                      type='button'
                      variant='paper'
                    >
                      Edit
                    </Button>
                    <Button
                      aria-label={`Delete ${collection.title}`}
                      disabled={deletingCollectionId === collection.id || collection.status === 'ARCHIVED'}
                      onClick={() => deleteCollection(collection)}
                      size='sm'
                      type='button'
                      variant='subtle'
                    >
                      {deletingCollectionId === collection.id ? 'Removing...' : 'Remove'}
                    </Button>
                  </div>
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
  const [uploadedTracks, setUploadedTracks] = useState(userUploadedTracks)
  const [worksCollections, setWorksCollections] = useState(userWorksCollections)
  const [batchStatusMessage, setBatchStatusMessage] = useState('')
  const [batchError, setBatchError] = useState('')
  const [defaultsDraft, setDefaultsDraft] = useState(null)
  const [editingDefaultsBatchId, setEditingDefaultsBatchId] = useState(null)
  const [savingDefaultsBatchId, setSavingDefaultsBatchId] = useState(null)
  const [submittingBatchId, setSubmittingBatchId] = useState(null)
  const [removingFailedTrackId, setRemovingFailedTrackId] = useState(null)

  const startEditingDefaults = batch => {
    setBatchError('')
    setBatchStatusMessage('')
    setEditingDefaultsBatchId(batch.id)
    setDefaultsDraft({
      defaultComposer: batch.defaultComposer || '',
      defaultInstrumentation: batch.defaultInstrumentation || '',
      defaultPricePence: batch.defaultPricePence ? String(batch.defaultPricePence) : '',
      label: batch.label || ''
    })
  }

  const updateDefaultsDraft = (field, value) => {
    setDefaultsDraft(currentDraft => ({
      ...(currentDraft || {}),
      [field]: value
    }))
  }

  const cancelEditingDefaults = () => {
    setEditingDefaultsBatchId(null)
    setDefaultsDraft(null)
  }

  const saveBatchDefaults = async batch => {
    setBatchError('')
    setBatchStatusMessage('')
    setSavingDefaultsBatchId(batch.id)

    try {
      const response = await fetch(`/api/upload-batches/${batch.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          defaultComposer: defaultsDraft?.defaultComposer || '',
          defaultInstrumentation: defaultsDraft?.defaultInstrumentation || '',
          defaultPricePence: defaultsDraft?.defaultPricePence || '',
          label: defaultsDraft?.label?.trim() || batch.label || `Upload batch #${batch.id}`
        })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update upload batch defaults')
      }

      setUploadBatches(currentBatches => currentBatches.map(currentBatch => (
        currentBatch.id === batch.id ? data.batch : currentBatch
      )))
      setBatchStatusMessage('Upload batch defaults updated.')
      cancelEditingDefaults()
    } catch (error) {
      setBatchError(error.message || 'Unable to update upload batch defaults')
    } finally {
      setSavingDefaultsBatchId(null)
    }
  }

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

  const removeFailedTrack = async ({ batch, track }) => {
    setBatchError('')
    setBatchStatusMessage('')
    setRemovingFailedTrackId(track.id)

    try {
      const response = await fetch(`/api/upload-batches/${batch.id}/tracks/${track.id}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to remove failed track')
      }

      setUploadBatches(currentBatches => currentBatches.map(currentBatch => (
        currentBatch.id === batch.id ? data.batch : currentBatch
      )))
      setBatchStatusMessage('Failed track removed from upload batch.')
    } catch (error) {
      setBatchError(error.message || 'Unable to remove failed track')
    } finally {
      setRemovingFailedTrackId(null)
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
                  <dd>{uploadedTracks.length}</dd>
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
                Upload single tracks first, then group related approved tracks into buyer-facing Works and Collections here. Each track remains individually visible in the catalogue, with collection membership shown as supporting context.
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

          <UploadedTracksManager
            onTrackUpdated={updatedTrack => setUploadedTracks(currentTracks => currentTracks.map(track => (
              track.id === updatedTrack.id ? { ...track, ...updatedTrack } : track
            )))}
            tracks={uploadedTracks}
          />

          <WorksCollectionsManager
            collections={worksCollections}
            onCreated={(collection, action = {}) => setWorksCollections(currentCollections => {
              if (action.deleteId) {
                return currentCollections.filter(currentCollection => currentCollection.id !== action.deleteId)
              }

              if (action.replaceId) {
                return currentCollections.map(currentCollection => (
                  currentCollection.id === action.replaceId ? collection : currentCollection
                ))
              }

              return [collection, ...currentCollections]
            })}
            tracks={uploadedTracks}
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
                    {(() => {
                      const capacity = batch.capacity || {
                        canAddTracks: batch.summary.totalTracks < maxUploadBatchTracks,
                        maxTracks: maxUploadBatchTracks,
                        remainingTracks: Math.max(0, maxUploadBatchTracks - batch.summary.totalTracks)
                      }
                      const usedPercent = Math.min(100, Math.round((batch.summary.totalTracks / capacity.maxTracks) * 100))
                      const submitBlocker = getUploadBatchSubmitBlocker(batch.summary)

                      return (
                        <>
                          <div className='cmc-upload-management-batch-capacity' aria-label={`${batch.summary.totalTracks} of ${capacity.maxTracks} upload batch slots used`}>
                            <span>{batch.summary.totalTracks}/{capacity.maxTracks} tracks</span>
                            <span>{capacity.remainingTracks} slots remaining</span>
                            <div aria-hidden='true'>
                              <span style={{ width: `${usedPercent}%` }} />
                            </div>
                          </div>
                          {submitBlocker && (
                            <p className='cmc-upload-management-submit-blocker'>{submitBlocker}</p>
                          )}
                        </>
                      )
                    })()}
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
                    {editingDefaultsBatchId === batch.id && defaultsDraft && (
                      <form
                        className='cmc-upload-management-defaults-form'
                        onSubmit={event => {
                          event.preventDefault()
                          saveBatchDefaults(batch)
                        }}
                      >
                        <label>
                          <span>Batch label</span>
                          <input
                            maxLength={255}
                            onChange={event => updateDefaultsDraft('label', event.target.value)}
                            placeholder='e.g. Mozart opera scenes import'
                            type='text'
                            value={defaultsDraft.label}
                          />
                        </label>
                        <label>
                          <span>Default composer</span>
                          <input
                            maxLength={255}
                            onChange={event => updateDefaultsDraft('defaultComposer', event.target.value)}
                            placeholder='Optional'
                            type='text'
                            value={defaultsDraft.defaultComposer}
                          />
                        </label>
                        <label>
                          <span>Default instrumentation</span>
                          <input
                            maxLength={255}
                            onChange={event => updateDefaultsDraft('defaultInstrumentation', event.target.value)}
                            placeholder='Optional'
                            type='text'
                            value={defaultsDraft.defaultInstrumentation}
                          />
                        </label>
                        <label>
                          <span>Default price</span>
                          <select
                            onChange={event => updateDefaultsDraft('defaultPricePence', event.target.value)}
                            value={defaultsDraft.defaultPricePence}
                          >
                            <option value=''>No default price</option>
                            {batchDefaultPriceOptions.map(pricePence => (
                              <option key={pricePence} value={pricePence}>
                                {formatPricePence(pricePence)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className='cmc-upload-management-defaults-actions'>
                          <Button disabled={savingDefaultsBatchId === batch.id} size='sm' type='submit' variant='ink'>
                            {savingDefaultsBatchId === batch.id ? 'Saving...' : 'Save defaults'}
                          </Button>
                          <Button disabled={savingDefaultsBatchId === batch.id} size='sm' type='button' variant='subtle' onClick={cancelEditingDefaults}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}
                    {batch.tracks?.some(track => track.processingStatus === 'FAILED') && (
                      <div className='cmc-upload-management-failed-tracks' role='group' aria-label={`${batch.label || `Upload batch #${batch.id}`} failed tracks`}>
                        <strong>Failed tracks</strong>
                        <ul>
                          {batch.tracks
                            .filter(track => track.processingStatus === 'FAILED')
                            .map(track => (
                              <li key={track.id}>
                                <span>{track.title}</span>
                                <Button
                                  disabled={removingFailedTrackId === track.id}
                                  onClick={() => removeFailedTrack({ batch, track })}
                                  size='sm'
                                  type='button'
                                  variant='subtle'
                                >
                                  {removingFailedTrackId === track.id ? 'Removing...' : 'Remove failed track'}
                                </Button>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                    <div className='cmc-upload-management-batch-actions'>
                      <Button as={Link} href={`/upload/manage/${batch.id}`} variant='subtle'>
                        View batch
                      </Button>
                      {resumableBatchStatuses.has(batch.status) && (
                        <>
                        <Button type='button' variant='subtle' onClick={() => startEditingDefaults(batch)}>
                          Edit defaults
                        </Button>
                        {batch.capacity?.canAddTracks === false ? (
                          <Button disabled type='button' variant='paper'>
                            Batch full
                          </Button>
                        ) : (
                          <Button as={Link} href={`/upload?batchId=${batch.id}`} variant='paper'>
                            Continue batch
                          </Button>
                        )}
                        <Button
                          disabled={submittingBatchId === batch.id || !canSubmitUploadBatch(batch)}
                          onClick={() => submitBatch(batch)}
                          type='button'
                          variant='ink'
                          title={getUploadBatchSubmitBlocker(batch.summary) || undefined}
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
