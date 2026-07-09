'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { BadgeCheck, Bookmark, Volume2 } from 'lucide-react'
import { useCart } from 'react-use-cart'
import BrandDisplayText from '../../brand/BrandDisplayText'
import PlaySample from '../../PlaySample'
import { Button } from '../../ui/primitives'
import { formatDisplayDate } from '../../../lib/date-format.mjs'
import {
  catalogueTypes,
  formatPricePence,
  getPricingBand,
  saleFormats
} from '../../../lib/pricing-policy.mjs'
import { canUseFullTrackPlayback } from '../../../lib/track-audio-access.mjs'

const catalogueReturnTrackIdStorageKey = 'cmc.catalogue.returnTrackId'
const catalogueReturnUrlStorageKey = 'cmc.catalogue.returnUrl'
const waveformBarCount = 180

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  currency: 'GBP',
  style: 'currency'
})

const formatTrackPrice = track => {
  if (Number.isInteger(track.pricePence)) {
    return currencyFormatter.format(track.pricePence / 100)
  }

  if (typeof track.formattedPrice === 'string' && track.formattedPrice.startsWith('GBP ')) {
    return track.formattedPrice.replace(/^GBP\s+/, '£')
  }

  return track.formattedPrice || 'Price unavailable'
}

const formatSeconds = seconds => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return null
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

const formatDuration = seconds => formatSeconds(seconds) || 'TBC'

const formatPreviewRange = track => {
  const previewStart = Number.isFinite(track.previewStart) ? track.previewStart : 0
  const previewEnd = Number.isFinite(track.previewEnd) && track.previewEnd > previewStart
    ? track.previewEnd
    : null

  if (!previewEnd) {
    return `From ${formatSeconds(previewStart) || '0:00'}`
  }

  return `${formatSeconds(previewStart) || '0:00'}-${formatSeconds(previewEnd) || 'TBC'}`
}

const createFallbackWaveform = trackId => {
  return Array.from({ length: waveformBarCount }, (_, index) => {
    const value = Math.sin((index + trackId) * 0.82) + Math.sin((index + 3) * 0.21)

    return Math.max(0.08, Math.min(0.92, 0.42 + value * 0.18))
  })
}

const getAudioContext = () => {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext

  return AudioContextConstructor ? new AudioContextConstructor() : null
}

const buildWaveformPeaks = audioBuffer => {
  const channelData = audioBuffer.getChannelData(0)
  const samplesPerBar = Math.max(1, Math.floor(channelData.length / waveformBarCount))
  const rawPeaks = Array.from({ length: waveformBarCount }, (_, index) => {
    const start = index * samplesPerBar
    const end = Math.min(channelData.length, start + samplesPerBar)
    let sampleEnergy = 0

    for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
      sampleEnergy += channelData[sampleIndex] ** 2
    }

    return Math.sqrt(sampleEnergy / Math.max(1, end - start))
  })
  const maxPeak = Math.max(...rawPeaks, 0.01)

  return rawPeaks.map(peak => Math.max(0.08, Math.min(1, peak / maxPeak)))
}

const clampPercentage = value => Math.max(0, Math.min(100, value))

const clampValue = (value, min, max) => Math.max(min, Math.min(max, value))

const getInitials = name => {
  if (!name) {
    return 'CM'
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

const detailTabLabels = {
  preview: 'Preview',
  details: 'Details',
  comments: 'Comments',
  requests: 'Requests'
}

const detailTabIds = Object.keys(detailTabLabels)

const requestStatusOptions = [
  {
    label: 'New request',
    value: 'OPEN'
  },
  {
    label: 'Pending decision',
    value: 'PENDING_DECISION'
  },
  {
    label: 'Accepted - preparing',
    value: 'ACCEPTED'
  },
  {
    label: 'Rejected',
    value: 'REJECTED'
  },
  {
    label: 'Completed',
    value: 'COMPLETED'
  }
]

const manageableRequestStatusOptions = requestStatusOptions.filter(option => option.value !== 'COMPLETED')

const saleFormatLabels = {
  [saleFormats.individual]: 'Individual download',
  [saleFormats.bundle]: 'Bundle only',
  [saleFormats.both]: 'Individual and collection'
}

const formatRequestStatus = status => {
  return requestStatusOptions.find(option => option.value === status)?.label || status
}

const requestRejectionReasonOptions = [
  {
    label: 'No reason selected',
    value: ''
  },
  {
    label: 'Outside current catalogue plans',
    value: 'outside_catalogue_plans'
  },
  {
    label: 'Rights or permissions unclear',
    value: 'rights_unclear'
  },
  {
    label: 'Not enough demand right now',
    value: 'not_enough_demand'
  },
  {
    label: 'Already covered by another track',
    value: 'already_covered'
  },
  {
    label: 'Uploader not available',
    value: 'uploader_unavailable'
  },
  {
    label: 'Other',
    value: 'other'
  }
]

const formatRejectionReason = reason => {
  return requestRejectionReasonOptions.find(option => option.value === reason)?.label || reason
}

const sortCommentsByTimestamp = (comments, direction) => {
  return [...comments].sort((firstComment, secondComment) => {
    const firstTime = Date.parse(firstComment.createdAtTimestamp || '')
    const secondTime = Date.parse(secondComment.createdAtTimestamp || '')
    const safeFirstTime = Number.isFinite(firstTime) ? firstTime : 0
    const safeSecondTime = Number.isFinite(secondTime) ? secondTime : 0

    return direction === 'newest-first'
      ? safeSecondTime - safeFirstTime
      : safeFirstTime - safeSecondTime
  })
}

const getInitialTab = searchParams => {
  const requestedTab = searchParams.get('tab')

  return detailTabIds.includes(requestedTab) ? requestedTab : 'preview'
}

const CatalogueTrackDetailContent = ({ catalogueContext, track, comments, requests = [] }) => {
  const searchParams = useSearchParams()
  const canPlayFullTrack = canUseFullTrackPlayback(track)
  const playbackMode = canPlayFullTrack ? 'full' : 'sample'
  const [activePreviewTrackId, setActivePreviewTrackId] = useState(null)
  const [activeTab, setActiveTab] = useState(() => getInitialTab(searchParams))
  const [returnContext, setReturnContext] = useState({
    label: 'Back to Catalogue',
    url: '/catalogue'
  })
  const [commentList, setCommentList] = useState(comments)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentError, setCommentError] = useState('')
  const [commentStatus, setCommentStatus] = useState('')
  const [commentSort, setCommentSort] = useState('newest-last')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [requestList, setRequestList] = useState(requests)
  const [requestTitle, setRequestTitle] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [requestError, setRequestError] = useState('')
  const [requestStatus, setRequestStatus] = useState('')
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const [requestStatusDrafts, setRequestStatusDrafts] = useState(() => {
    return Object.fromEntries(requests.map(request => [request.id, request.status]))
  })
  const [requestRejectionDrafts, setRequestRejectionDrafts] = useState(() => {
    return Object.fromEntries(requests.map(request => [
      request.id,
      {
        note: request.rejectionNote || '',
        reason: request.rejectionReason || ''
      }
    ]))
  })
  const [requestUpdateError, setRequestUpdateError] = useState('')
  const [requestUpdateStatus, setRequestUpdateStatus] = useState('')
  const [updatingRequestId, setUpdatingRequestId] = useState(null)
  const [requestPricingDrafts, setRequestPricingDrafts] = useState(() => {
    return Object.fromEntries(requests.map(request => {
      const initialType = request.pricingProposals?.[0]?.catalogueType || catalogueTypes.singleTrack
      const initialBand = getPricingBand(initialType)
      const initialPricePence = request.pricingProposals?.[0]?.pricePence || initialBand.defaultPricePence

      return [
        request.id,
        {
          catalogueType: initialType,
          justification: request.pricingProposals?.[0]?.justification || '',
          pricePence: initialPricePence,
          saleFormat: request.pricingProposals?.[0]?.saleFormat || saleFormats.individual
        }
      ]
    }))
  })
  const [pricingProposalRequestId, setPricingProposalRequestId] = useState(null)
  const [previewVolume, setPreviewVolume] = useState(78)
  const [isWaveformLoading, setIsWaveformLoading] = useState(true)
  const [waveformPeaks, setWaveformPeaks] = useState(() => createFallbackWaveform(track.id))
  const [waveformDuration, setWaveformDuration] = useState(track.durationSeconds || track.previewEnd || 1)
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0)
  const [previewSeekCommand, setPreviewSeekCommand] = useState(null)
  const [isScrubbingPreview, setIsScrubbingPreview] = useState(false)
  const [showCartConfirmation, setShowCartConfirmation] = useState(false)
  const { addItem } = useCart()
  const focusedCommentId = Number(searchParams.get('commentId'))
  const focusedRequestId = Number(searchParams.get('requestId'))

  const getStoredReturnContext = useCallback(() => {
    if (typeof window === 'undefined') {
      return null
    }

    const returnTrackId = sessionStorage.getItem(catalogueReturnTrackIdStorageKey)
    const returnUrl = sessionStorage.getItem(catalogueReturnUrlStorageKey)

    if (returnTrackId !== String(track.id)) {
      return null
    }

    if (returnUrl?.startsWith('/profile')) {
      return {
        label: 'Back to Profile',
        url: returnUrl
      }
    }

    if (returnUrl?.startsWith('/catalogue')) {
      return {
        label: 'Back to Catalogue',
        url: returnUrl
      }
    }

    return null
  }, [track.id])

  useEffect(() => {
    const nextReturnContext = getStoredReturnContext() || {
      label: 'Back to Catalogue',
      url: '/catalogue'
    }
    const frameId = window.requestAnimationFrame(() => {
      setReturnContext(nextReturnContext)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [getStoredReturnContext])

  useEffect(() => {
    if (!Number.isInteger(focusedCommentId) || activeTab !== 'comments') {
      return
    }

    window.requestAnimationFrame(() => {
      document.getElementById(`comment-${focusedCommentId}`)?.scrollIntoView({
        block: 'center',
        behavior: 'smooth'
      })
    })
  }, [activeTab, focusedCommentId])

  useEffect(() => {
    if (!Number.isInteger(focusedRequestId) || activeTab !== 'requests') {
      return
    }

    window.requestAnimationFrame(() => {
      document.getElementById(`request-${focusedRequestId}`)?.scrollIntoView({
        block: 'center',
        behavior: 'smooth'
      })
    })
  }, [activeTab, focusedRequestId])

  useEffect(() => {
    if (activeTab !== 'preview') {
      return undefined
    }

    let cancelled = false
    let audioContext
    let loadingTimer

    const minimumLoadingMs = 900

    const loadWaveform = async () => {
      const loadingStartedAt = window.performance.now()
      setIsWaveformLoading(true)

      const finishLoading = () => {
        const elapsedMs = window.performance.now() - loadingStartedAt
        const remainingMs = Math.max(0, minimumLoadingMs - elapsedMs)

        loadingTimer = window.setTimeout(() => {
          if (!cancelled) {
            setIsWaveformLoading(false)
          }
        }, remainingMs)
      }

      try {
        const signedUrlResponse = await fetch(`/api/tracks/${track.id}/signed-url?mode=${playbackMode}`)
        const signedUrlData = await signedUrlResponse.json()

        if (!signedUrlResponse.ok) {
          throw new Error(signedUrlData.message || signedUrlData.error || 'Preview waveform unavailable')
        }

        const audioResponse = await fetch(signedUrlData.url)
        const arrayBuffer = await audioResponse.arrayBuffer()
        audioContext = getAudioContext()

        if (!audioContext) {
          throw new Error('Audio decoding unavailable')
        }

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        if (!cancelled) {
          setWaveformPeaks(buildWaveformPeaks(audioBuffer))
          setWaveformDuration(audioBuffer.duration)
          finishLoading()
        }
      } catch {
        if (!cancelled) {
          setWaveformPeaks(createFallbackWaveform(track.id))
          setWaveformDuration(track.durationSeconds || track.previewEnd || 1)
          finishLoading()
        }
      } finally {
        audioContext?.close?.()
      }
    }

    loadWaveform()

    return () => {
      cancelled = true
      window.clearTimeout(loadingTimer)
    }
  }, [activeTab, playbackMode, track.durationSeconds, track.id, track.previewEnd])

  const goBackToCatalogue = () => {
    const storedReturnContext = getStoredReturnContext()
    const returnUrl = storedReturnContext?.url || returnContext.url

    if (returnUrl && window.history.length > 1) {
      window.history.back()
      return
    }

    window.location.assign(returnUrl || '/catalogue')
  }

  const addToCart = () => {
    addItem({ ...track })
    setShowCartConfirmation(true)
  }

  const submitComment = async event => {
    event.preventDefault()
    setCommentError('')
    setCommentStatus('')

    const trimmedComment = commentDraft.trim()

    if (!trimmedComment) {
      setCommentError('Please add a comment before submitting.')
      return
    }

    if (trimmedComment.length > 500) {
      setCommentError('Comments must be 500 characters or fewer.')
      return
    }

    setIsSubmittingComment(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trackId: track.id,
          comment: trimmedComment
        })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to add comment')
      }

      setCommentList(currentComments => [
        ...currentComments,
        {
          content: data.content,
          createdAt: formatDisplayDate(data.createdAt),
          createdAtTimestamp: data.createdAt,
          id: data.id,
          isTrackOwner,
          userId: data.userId,
          userName: catalogueContext.userName || 'You'
        }
      ])
      setCommentDraft('')
      setCommentStatus('Your comment has been added.')
    } catch (error) {
      setCommentError(error.message || 'Unable to add comment')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const submitRequest = async event => {
    event.preventDefault()
    setRequestError('')
    setRequestStatus('')

    const trimmedTitle = requestTitle.trim()
    const trimmedNotes = requestNotes.trim()

    if (!trimmedTitle) {
      setRequestError('Please add a request title before submitting.')
      return
    }

    setIsSubmittingRequest(true)

    try {
      const response = await fetch('/api/track-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trackId: track.id,
          title: trimmedTitle,
          notes: trimmedNotes || undefined
        })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to add request')
      }

      setRequestList(currentRequests => [
        {
          createdAt: formatDisplayDate(data.createdAt),
          description: data.notes || 'No additional request notes supplied.',
          id: data.id,
          requestedBy: catalogueContext.userName || 'You',
          status: data.status,
          title: data.title,
          userId: data.userId
        },
        ...currentRequests
      ])
      setRequestTitle('')
      setRequestNotes('')
      setRequestStatus('Your request has been added.')
    } catch (error) {
      setRequestError(error.message || 'Unable to add request')
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  const submitRequestStatus = async requestId => {
    setRequestUpdateError('')
    setRequestUpdateStatus('')
    setUpdatingRequestId(requestId)

    const nextStatus = String(requestStatusDrafts[requestId] || '')
    const rejectionDraft = requestRejectionDrafts[requestId] || {}

    try {
      const response = await fetch(`/api/track-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rejectionNote: nextStatus === 'REJECTED' ? rejectionDraft.note || undefined : undefined,
          rejectionReason: nextStatus === 'REJECTED' ? rejectionDraft.reason || undefined : undefined,
          status: nextStatus
        })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update request')
      }

      setRequestList(currentRequests => currentRequests.map(request => (
        request.id === requestId
          ? {
              ...request,
              rejectionNote: data.rejectionNote,
              rejectionReason: data.rejectionReason,
              status: data.status
            }
          : request
      )))
      setRequestStatusDrafts(currentDrafts => ({
        ...currentDrafts,
        [requestId]: data.status
      }))
      setRequestRejectionDrafts(currentDrafts => ({
        ...currentDrafts,
        [requestId]: {
          note: data.rejectionNote || '',
          reason: data.rejectionReason || ''
        }
      }))
      setRequestUpdateStatus('Request status updated.')
    } catch (error) {
      setRequestUpdateError(error.message || 'Unable to update request')
    } finally {
      setUpdatingRequestId(null)
    }
  }

  const updateRequestPricingDraft = (requestId, patch) => {
    setRequestPricingDrafts(currentDrafts => {
      const currentDraft = currentDrafts[requestId] || {
        catalogueType: catalogueTypes.singleTrack,
        justification: '',
        pricePence: getPricingBand(catalogueTypes.singleTrack).defaultPricePence,
        saleFormat: saleFormats.individual
      }
      const nextDraft = {
        ...currentDraft,
        ...patch
      }

      if (patch.catalogueType) {
        nextDraft.pricePence = getPricingBand(patch.catalogueType).defaultPricePence
        nextDraft.justification = ''
      }

      return {
        ...currentDrafts,
        [requestId]: nextDraft
      }
    })
  }

  const submitRequestPricingProposal = async requestId => {
    setRequestUpdateError('')
    setRequestUpdateStatus('')
    setPricingProposalRequestId(requestId)

    const draft = requestPricingDrafts[requestId] || {
      catalogueType: catalogueTypes.singleTrack,
      justification: '',
      pricePence: getPricingBand(catalogueTypes.singleTrack).defaultPricePence,
      saleFormat: saleFormats.individual
    }

    try {
      const response = await fetch(`/api/track-requests/${requestId}/pricing-proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catalogueType: draft.catalogueType,
          justification: draft.justification.trim() || undefined,
          pricePence: Number(draft.pricePence),
          saleFormat: draft.saleFormat
        })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to propose request price')
      }

      const nextProposal = {
        catalogueType: data.catalogueType,
        createdAt: formatDisplayDate(data.createdAt),
        currency: data.currency,
        id: data.id,
        justification: data.justification,
        pricePence: data.pricePence,
        requesterDecision: data.requesterDecision,
        reviewStatus: data.reviewStatus,
        saleFormat: data.saleFormat
      }

      setRequestList(currentRequests => currentRequests.map(request => (
        request.id === requestId
          ? {
              ...request,
              pricingProposals: [
                nextProposal,
                ...(request.pricingProposals || [])
              ].slice(0, 3),
              status: request.status === 'OPEN' ? 'PENDING_DECISION' : request.status
            }
          : request
      )))
      setRequestPricingDrafts(currentDrafts => ({
        ...currentDrafts,
        [requestId]: {
          catalogueType: data.catalogueType,
          justification: data.justification || '',
          pricePence: data.pricePence,
          saleFormat: data.saleFormat
        }
      }))
      setRequestUpdateStatus('Request price proposal sent.')
    } catch (error) {
      setRequestUpdateError(error.message || 'Unable to propose request price')
    } finally {
      setPricingProposalRequestId(null)
    }
  }

  const commentCount = commentList.length
  const sortedComments = useMemo(() => (
    sortCommentsByTimestamp(commentList, commentSort)
  ), [commentList, commentSort])
  const requestCount = requestList.length
  const isTrackOwner = Boolean(track.viewerState?.isUploadedByViewer)
  const canComment = catalogueContext.isAuthenticated && (track.viewerState?.isOwned || isTrackOwner)
  const showBasketAction = catalogueContext.isAuthenticated &&
    !track.viewerState?.isOwned &&
    !isTrackOwner &&
    !catalogueContext.showOperationsOverlay
  const showOwnedAction = track.viewerState?.isOwned && !isTrackOwner
  const showOperationsAction = catalogueContext.showOperationsOverlay && !isTrackOwner
  const showWishlistAction = !showOwnedAction && !isTrackOwner
  const showPurchaseDivider = showWishlistAction && (showBasketAction || showOperationsAction || !catalogueContext.isAuthenticated)
  const wishlistHref = `/wishlist/add?trackId=${track.id}`
  const noteText = track.additionalInfo || 'No additional information has been supplied for this track.'
  const previewStart = 0
  const previewEnd = waveformDuration
  const safeWaveformDuration = Math.max(0.01, waveformDuration)
  const previewWindowStart = clampPercentage((previewStart / safeWaveformDuration) * 100)
  const previewWindowEnd = clampPercentage((previewEnd / safeWaveformDuration) * 100)
  const previewWindowWidth = Math.max(0, previewWindowEnd - previewWindowStart)
  const previewPlayheadPosition = clampPercentage((previewCurrentTime / safeWaveformDuration) * 100)
  const seekPreviewFromPointer = event => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const pointerRatio = bounds.width > 0
      ? clampValue((event.clientX - bounds.left) / bounds.width, 0, 1)
      : 0
    const waveformTime = pointerRatio * safeWaveformDuration
    const seekTime = clampValue(waveformTime, previewStart, previewEnd)

    setPreviewCurrentTime(seekTime)
    setPreviewSeekCommand({ time: seekTime, requestedAt: Date.now() })
  }
  const startPreviewScrub = event => {
    if (activePreviewTrackId !== track.id) {
      return
    }

    event.currentTarget.setPointerCapture?.(event.pointerId)
    setIsScrubbingPreview(true)
    seekPreviewFromPointer(event)
  }
  const movePreviewScrub = event => {
    if (!isScrubbingPreview || activePreviewTrackId !== track.id) {
      return
    }

    seekPreviewFromPointer(event)
  }
  const stopPreviewScrub = event => {
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    setIsScrubbingPreview(false)
  }
  const seekPreviewBySeconds = seconds => {
    if (activePreviewTrackId !== track.id) {
      return
    }

    const seekTime = clampValue(previewCurrentTime + seconds, previewStart, previewEnd)

    setPreviewCurrentTime(seekTime)
    setPreviewSeekCommand({ time: seekTime, requestedAt: Date.now() })
  }
  const handlePreviewSliderKeyDown = event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      seekPreviewBySeconds(-1)
      return
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      seekPreviewBySeconds(1)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      setPreviewCurrentTime(previewStart)
      setPreviewSeekCommand({ time: previewStart, requestedAt: Date.now() })
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      setPreviewCurrentTime(previewEnd)
      setPreviewSeekCommand({ time: previewEnd, requestedAt: Date.now() })
    }
  }
  const previewFacts = [
    {
      label: 'Key',
      value: track.key || 'Unspecified'
    },
    {
      label: 'Tempo',
      value: track.tempo || 'Andante'
    },
    {
      label: 'Duration',
      value: formatDuration(track.durationSeconds)
    },
    {
      label: 'Instrumentation',
      value: track.instrumentation || 'Unspecified'
    },
    {
      label: 'Quality',
      value: track.sourceContentType === 'audio/wav' ? '24-bit WAV' : track.sourceContentType || 'Unknown'
    }
  ]

  const renderBackButton = className => (
    <Button
      type='button'
      variant='paper'
      size='sm'
      className={['cmc-track-back-button', className].filter(Boolean).join(' ')}
      onClick={goBackToCatalogue}
    >
      <span className='cmc-button-icon' aria-hidden='true'>←</span>
      {returnContext.label}
    </Button>
  )

  const renderTabButton = tabId => {
    const count = tabId === 'comments'
      ? commentCount
      : tabId === 'requests'
        ? requestCount
        : null

    return (
      <button
        aria-controls={`track-tab-panel-${tabId}`}
        aria-selected={activeTab === tabId}
        className='cmc-track-tab-button'
        id={`track-tab-${tabId}`}
        key={tabId}
        onClick={() => setActiveTab(tabId)}
        role='tab'
        type='button'
      >
        {detailTabLabels[tabId]} {count !== null && <span>({count})</span>}
      </button>
    )
  }

  return (
    <main className='cmc-track-page'>
      <div className='container'>
        <section className='cmc-track-board cmc-track-board--option-one' aria-labelledby='track-detail-heading'>
          <header className='cmc-track-board-header'>
            <div className='cmc-track-hero-staff' aria-hidden='true' />
            <div className='cmc-track-hero-paper' aria-hidden='true' />
            <div className='cmc-track-title-block'>
              <h1 id='track-detail-heading'>
                <BrandDisplayText text={track.title} />
              </h1>
              <p className='cmc-track-composer'>{track.composer || 'Unknown composer'}</p>
              <p className='cmc-track-uploader-line'>
                <span>Uploaded by {track.uploaderName || 'Unknown'}</span>
                <span aria-hidden='true' />
                <time>{track.uploadedAt || 'Unknown date'}</time>
              </p>
            </div>

            <aside
              className='cmc-track-purchase-panel'
              aria-label={isTrackOwner ? 'Uploader track activity' : 'Purchase track'}
            >
              {isTrackOwner ? (
                <dl className='cmc-track-owner-stats' aria-label='Uploader track activity'>
                  <div>
                    <dt>Downloads</dt>
                    <dd>{track._count?.TrackOwner || 0}</dd>
                  </div>
                  <div>
                    <dt>Comments</dt>
                    <dd>{commentCount}</dd>
                  </div>
                  <div>
                    <dt>Requests</dt>
                    <dd>{requestCount}</dd>
                  </div>
                </dl>
              ) : !showOwnedAction && <strong>{formatTrackPrice(track)}</strong>}
              {showBasketAction && (
                <Button variant='ink' size='md' onClick={addToCart}>
                  Add to Cart
                </Button>
              )}
              {showOwnedAction && (
                <Button as={Link} href='/profile' variant='ink' size='md'>
                  View in Library
                </Button>
              )}
              {track.viewerState?.isUploadedByViewer && (
                <p>
                  This is one of your uploaded catalogue tracks.
                </p>
              )}
              {showOperationsAction && (
                <Button as={Link} href='/admin' variant='secondary' size='md'>
                  Operations Console
                </Button>
              )}
              {!catalogueContext.isAuthenticated && (
                <p>
                  Please <Link href='/auth/signin?callbackUrl=/catalogue'>login</Link> to add this track to your cart.
                </p>
              )}
              {showPurchaseDivider && <span className='cmc-track-purchase-divider' aria-hidden='true' />}
              {showWishlistAction && (
                <Button as={Link} href={wishlistHref} variant='paper' size='md' className='cmc-track-wishlist-button'>
                  <Bookmark aria-hidden='true' className='cmc-track-wishlist-icon' strokeWidth={1.8} />
                  <span className='cmc-track-wishlist-label'>
                    {track.viewerState?.isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
                  </span>
                </Button>
              )}
            </aside>
          </header>

          <section className='cmc-track-tab-board' aria-label='Track media and community'>
            <div className='cmc-track-tab-list' role='tablist' aria-label='Track detail sections'>
              {['preview', 'details', 'comments', 'requests'].map(renderTabButton)}
            </div>

            <div
              aria-labelledby={`track-tab-${activeTab}`}
              className='cmc-track-tab-panel'
              id={`track-tab-panel-${activeTab}`}
              role='tabpanel'
            >
              {activeTab === 'preview' && (
                <div className='cmc-track-preview-tab'>
                  <div className='cmc-track-preview-panel' id='track-preview' aria-label='Preview'>
                    <PlaySample
                      active={activePreviewTrackId === track.id}
                      mode={playbackMode}
                      onActivate={() => setActivePreviewTrackId(track.id)}
                      onDeactivate={() => setActivePreviewTrackId(null)}
                      onProgress={setPreviewCurrentTime}
                      seekCommand={previewSeekCommand}
                      track={track}
                      volume={previewVolume / 100}
                    />
                    <div className='cmc-track-preview-waveform'>
                      <p>Preview <span>({formatPreviewRange(track)})</span></p>
                      <div
                        className={isWaveformLoading ? 'cmc-track-waveform-strip cmc-track-waveform-strip--loading' : 'cmc-track-waveform-strip'}
                        style={{ '--cmc-waveform-bars': waveformPeaks.length }}
                        aria-label='Preview playback position'
                        aria-busy={isWaveformLoading}
                        aria-valuemax={Math.round(previewEnd)}
                        aria-valuemin={Math.round(previewStart)}
                        aria-valuenow={Math.round(previewCurrentTime)}
                        aria-valuetext={`${formatSeconds(Math.round(previewCurrentTime)) || '0:00'} preview position`}
                        onKeyDown={handlePreviewSliderKeyDown}
                        onPointerCancel={stopPreviewScrub}
                        onPointerDown={startPreviewScrub}
                        onPointerLeave={stopPreviewScrub}
                        onPointerMove={movePreviewScrub}
                        onPointerUp={stopPreviewScrub}
                        role='slider'
                        tabIndex={activePreviewTrackId === track.id ? 0 : -1}
                      >
                        {activePreviewTrackId === track.id && (
                          <>
                            <span
                              className='cmc-track-preview-window'
                              style={{
                                '--cmc-preview-window-left': `${previewWindowStart}%`,
                                '--cmc-preview-window-width': `${previewWindowWidth}%`
                              }}
                            />
                            <span
                              className='cmc-track-preview-playhead'
                              style={{ '--cmc-preview-playhead-left': `${previewPlayheadPosition}%` }}
                            />
                          </>
                        )}
                        {waveformPeaks.map((peak, index) => (
                          <span
                            key={index}
                            style={{
                              '--cmc-wave-bar': `${Math.round(8 + peak * 92)}%`,
                              '--cmc-wave-delay': `${index * -28}ms`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className='cmc-track-volume-control'>
                      <Volume2 aria-hidden='true' />
                      <input
                        aria-label='Preview volume'
                        max='100'
                        min='0'
                        onChange={event => setPreviewVolume(Number(event.target.value))}
                        type='range'
                        value={previewVolume}
                      />
                    </div>
                  </div>

                  <dl className='cmc-track-facts-grid'>
                    {previewFacts.map(tile => (
                      <div key={tile.label}>
                        <dt>{tile.label}</dt>
                        <dd>
                          <strong>{tile.value}</strong>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {activeTab === 'details' && (
                <section className='cmc-track-notes-panel' id='track-notes' aria-label='Additional information'>
                  <span>Additional Notes</span>
                  <p>{noteText}</p>
                </section>
              )}

              {activeTab === 'comments' && (
                <section className='cmc-track-comments-section' id='track-comments'>
                  <div className='cmc-track-section-header'>
                    <h2>Comments <span>({commentCount})</span></h2>
                    <label className='cmc-track-comment-sort'>
                      <span>Sort</span>
                      <select
                        aria-label='Sort comments'
                        onChange={event => setCommentSort(event.target.value)}
                        value={commentSort}
                      >
                        <option value='newest-last'>Newest at bottom</option>
                        <option value='newest-first'>Newest at top</option>
                      </select>
                    </label>
                  </div>
                  <div className='cmc-track-comments'>
                    {sortedComments.map((comment, key) => (
                      <div
                        className={[
                          'cmc-track-comment',
                          comment.id === focusedCommentId ? 'cmc-track-comment--focused' : '',
                          comment.isTrackOwner ? 'cmc-track-comment--owner' : ''
                        ].filter(Boolean).join(' ')}
                        id={`comment-${comment.id}`}
                        key={comment.id}
                      >
                        <span className='cmc-track-comment-avatar'>{getInitials(comment.userName)}</span>
                        <div>
                          <header>
                            <strong>{comment.userName}</strong>
                            {comment.isTrackOwner && (
                              <span className='cmc-track-owner-comment-badge'>
                                <BadgeCheck aria-hidden='true' strokeWidth={1.8} />
                                Track uploader
                              </span>
                            )}
                            <time>{comment.createdAt}</time>
                          </header>
                          <p>{comment.content}</p>
                          <footer>
                            <button type='button'>Reply</button>
                            <span>·</span>
                            <button type='button'>Helpful</button>
                          </footer>
                        </div>
                        <button className='cmc-track-comment-menu' aria-label={`More actions for comment ${key + 1}`} type='button'>
                          ...
                        </button>
                      </div>
                    ))}
                    {commentList.length === 0 && (
                      <p className='cmc-track-empty'>
                        No comments yet. After purchasing this track you will be able to leave comments about it.
                      </p>
                    )}
                  </div>

                  <div className='cmc-track-comment-action'>
                    {canComment ? (
                      <form onSubmit={submitComment}>
                        <label htmlFor='track-comment'>Add your comment</label>
                        <textarea
                          id='track-comment'
                          maxLength='500'
                          onChange={event => setCommentDraft(event.target.value)}
                          placeholder='Share a useful note about balance, tempo, cuts, or rehearsal use.'
                          rows='4'
                          value={commentDraft}
                        />
                        <div>
                          <small>{commentDraft.trim().length}/500</small>
                          <Button disabled={isSubmittingComment} type='submit' variant='ink'>
                            {isSubmittingComment ? 'Adding...' : 'Add Comment'}
                          </Button>
                        </div>
                        {commentError && <p className='cmc-track-comment-message cmc-track-comment-message--error' role='alert'>{commentError}</p>}
                        {commentStatus && <p className='cmc-track-comment-message' role='status'>{commentStatus}</p>}
                      </form>
                    ) : catalogueContext.isAuthenticated ? (
                      <p>
                        Purchase this track to add your comment to the discussion.
                      </p>
                    ) : (
                      <p aria-label='Sign in and purchase this track to add your comment'>
                        You need to be logged in and have purchased this track to leave a comment.{' '}
                        <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(`/catalogue/${track.id}?tab=comments`)}`}>
                          Sign in
                        </Link>
                      </p>
                    )}
                  </div>
                </section>
              )}

              {activeTab === 'requests' && (
                <section className='cmc-track-requests-section' id='track-requests'>
                  <div className='cmc-track-section-header'>
                    <h2>Requests <span>({requestCount})</span></h2>
                    <small>Open community requests</small>
                  </div>
                  <div className='cmc-track-requests'>
                    {requestList.map(request => {
                      const draftStatus = requestStatusDrafts[request.id] || request.status
                      const rejectionDraft = requestRejectionDrafts[request.id] || {
                        note: '',
                        reason: ''
                      }
                      const pricingDraft = requestPricingDrafts[request.id] || {
                        catalogueType: catalogueTypes.singleTrack,
                        justification: '',
                        pricePence: getPricingBand(catalogueTypes.singleTrack).defaultPricePence,
                        saleFormat: saleFormats.individual
                      }
                      const pricingBand = getPricingBand(pricingDraft.catalogueType)
                      const latestProposal = request.pricingProposals?.[0]

                      return (
                        <article
                          className={request.id === focusedRequestId ? 'cmc-track-request cmc-track-request--focused' : 'cmc-track-request'}
                          id={`request-${request.id}`}
                          key={request.id}
                        >
                          <header>
                            <strong>{request.title}</strong>
                            <span>{formatRequestStatus(request.status)}</span>
                          </header>
                          <p>{request.description}</p>
                          <footer>
                            <span>{request.requestedBy}</span>
                            <span>{request.createdAt}</span>
                          </footer>
                          {request.status === 'REJECTED' && (request.rejectionReason || request.rejectionNote) && (
                            <div className='cmc-track-request-rejection-note'>
                              {request.rejectionReason && (
                                <strong>{formatRejectionReason(request.rejectionReason)}</strong>
                              )}
                              {request.rejectionNote && (
                                <span>{request.rejectionNote}</span>
                              )}
                            </div>
                          )}
                          {request.fulfilledByTrack && (
                            <p className='cmc-track-request-fulfilment'>
                              Fulfilment uploaded: <strong>{request.fulfilledByTrack.title}</strong>
                              {request.fulfilledByTrack.moderationStatus === 'PENDING' ? ' (waiting for review)' : ''}
                            </p>
                          )}
                          {latestProposal && (
                            <div className='cmc-track-request-pricing-summary'>
                              <div>
                                <strong>{formatPricePence(latestProposal.pricePence)}</strong>
                                <span>{getPricingBand(latestProposal.catalogueType).label} · {saleFormatLabels[latestProposal.saleFormat] || latestProposal.saleFormat}</span>
                              </div>
                              <dl>
                                <div>
                                  <dt>Review</dt>
                                  <dd>{latestProposal.reviewStatus === 'NEEDS_REVIEW' ? 'Admin review needed' : 'Within band'}</dd>
                                </div>
                                <div>
                                  <dt>Requester</dt>
                                  <dd>{latestProposal.requesterDecision.toLowerCase()}</dd>
                                </div>
                              </dl>
                              {latestProposal.justification && (
                                <p>{latestProposal.justification}</p>
                              )}
                            </div>
                          )}
                          {isTrackOwner && request.status !== 'COMPLETED' && (
                            <div
                              className='cmc-track-request-status-form'
                            >
                              <div className='cmc-track-request-status-field'>
                                <label htmlFor={`request-status-${request.id}`}>Request status</label>
                                <select
                                  id={`request-status-${request.id}`}
                                  name='status'
                                  onChange={event => setRequestStatusDrafts(currentDrafts => ({
                                    ...currentDrafts,
                                    [request.id]: event.target.value
                                  }))}
                                  value={draftStatus}
                                >
                                  {manageableRequestStatusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <Button
                                disabled={updatingRequestId === request.id}
                                onClick={() => submitRequestStatus(request.id)}
                                size='sm'
                                type='button'
                                variant='paper'
                              >
                                {updatingRequestId === request.id ? 'Updating...' : 'Update'}
                              </Button>
                              {request.status === 'ACCEPTED' && (
                                <Button
                                  as={Link}
                                  href={`/upload?fulfilledRequestId=${request.id}`}
                                  size='sm'
                                  variant='ink'
                                >
                                  Upload Fulfilment
                                </Button>
                              )}
                              {draftStatus === 'REJECTED' && (
                                <div className='cmc-track-request-rejection-fields'>
                                  <div>
                                    <label htmlFor={`request-rejection-reason-${request.id}`}>Reason (optional)</label>
                                    <select
                                      id={`request-rejection-reason-${request.id}`}
                                      name='rejectionReason'
                                      onChange={event => setRequestRejectionDrafts(currentDrafts => ({
                                        ...currentDrafts,
                                        [request.id]: {
                                          ...rejectionDraft,
                                          reason: event.target.value
                                        }
                                      }))}
                                      value={rejectionDraft.reason}
                                    >
                                      {requestRejectionReasonOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label htmlFor={`request-rejection-note-${request.id}`}>Message (optional)</label>
                                    <textarea
                                      id={`request-rejection-note-${request.id}`}
                                      maxLength={1000}
                                      name='rejectionNote'
                                      onChange={event => setRequestRejectionDrafts(currentDrafts => ({
                                        ...currentDrafts,
                                        [request.id]: {
                                          ...rejectionDraft,
                                          note: event.target.value
                                        }
                                      }))}
                                      placeholder='Add a short note for the requester'
                                      rows={3}
                                      value={rejectionDraft.note}
                                    />
                                  </div>
                                </div>
                              )}
                              <div className='cmc-track-request-pricing-form'>
                                <div className='cmc-track-request-pricing-heading'>
                                  <strong>Request fulfilment price</strong>
                                  <span>Use CMC guided bands before preparing bespoke work.</span>
                                </div>
                                <div className='cmc-track-request-pricing-grid'>
                                  <div>
                                    <label htmlFor={`request-pricing-type-${request.id}`}>Type</label>
                                    <select
                                      id={`request-pricing-type-${request.id}`}
                                      onChange={event => updateRequestPricingDraft(request.id, {
                                        catalogueType: event.target.value
                                      })}
                                      value={pricingDraft.catalogueType}
                                    >
                                      {Object.values(catalogueTypes).map(type => (
                                        <option key={type} value={type}>
                                          {getPricingBand(type).label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label htmlFor={`request-pricing-sale-format-${request.id}`}>Sale format</label>
                                    <select
                                      id={`request-pricing-sale-format-${request.id}`}
                                      onChange={event => updateRequestPricingDraft(request.id, {
                                        saleFormat: event.target.value
                                      })}
                                      value={pricingDraft.saleFormat}
                                    >
                                      {Object.values(saleFormats).map(format => (
                                        <option key={format} value={format}>
                                          {saleFormatLabels[format]}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className='cmc-track-request-price-options' role='radiogroup' aria-label={`Request price for ${request.title}`}>
                                  {pricingBand.options.map(pricePence => (
                                    <label
                                      className={Number(pricingDraft.pricePence) === pricePence ? 'cmc-track-request-price-option cmc-track-request-price-option--selected' : 'cmc-track-request-price-option'}
                                      key={pricePence}
                                    >
                                      <input
                                        checked={Number(pricingDraft.pricePence) === pricePence}
                                        name={`request-price-${request.id}`}
                                        onChange={() => updateRequestPricingDraft(request.id, {
                                          pricePence
                                        })}
                                        type='radio'
                                        value={pricePence}
                                      />
                                      <span>{formatPricePence(pricePence)}</span>
                                    </label>
                                  ))}
                                </div>
                                <div>
                                  <label htmlFor={`request-pricing-justification-${request.id}`}>Pricing note (optional)</label>
                                  <textarea
                                    id={`request-pricing-justification-${request.id}`}
                                    maxLength={2000}
                                    onChange={event => updateRequestPricingDraft(request.id, {
                                      justification: event.target.value
                                    })}
                                    placeholder='Explain specialist preparation, cuts, length, or other context.'
                                    rows={3}
                                    value={pricingDraft.justification}
                                  />
                                </div>
                                <Button
                                  disabled={pricingProposalRequestId === request.id}
                                  onClick={() => submitRequestPricingProposal(request.id)}
                                  size='sm'
                                  type='button'
                                  variant='ink'
                                >
                                  {pricingProposalRequestId === request.id ? 'Sending...' : 'Propose Price'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </article>
                      )
                    })}
                    {requestList.length === 0 && (
                      <p className='cmc-track-empty'>
                        No requests yet. Community requests for alternate cuts, keys, and parts will appear here.
                      </p>
                    )}
                  </div>

                  <div className='cmc-track-request-action'>
                    {isTrackOwner ? (
                      <p>
                        Manage request status from each request above. New requests are created by catalogue members.
                      </p>
                    ) : catalogueContext.isAuthenticated ? (
                      <form onSubmit={submitRequest}>
                        <h3>Make a request</h3>
                        <label htmlFor='track-request-title'>Request title</label>
                        <input
                          id='track-request-title'
                          maxLength='255'
                          onChange={event => setRequestTitle(event.target.value)}
                          placeholder='e.g. Slower practice tempo'
                          type='text'
                          value={requestTitle}
                        />
                        <textarea
                          aria-label='Request notes'
                          maxLength='1000'
                          onChange={event => setRequestNotes(event.target.value)}
                          placeholder='Add useful context for the uploader, such as tempo, key, cut, or instrumentation.'
                          rows='4'
                          value={requestNotes}
                        />
                        <div>
                          <small>{requestNotes.trim().length}/1000</small>
                          <Button disabled={isSubmittingRequest} type='submit' variant='ink'>
                            {isSubmittingRequest ? 'Adding...' : 'Add Request'}
                          </Button>
                        </div>
                        {requestError && <p className='cmc-track-comment-message cmc-track-comment-message--error' role='alert'>{requestError}</p>}
                        {requestStatus && <p className='cmc-track-comment-message' role='status'>{requestStatus}</p>}
                      </form>
                    ) : (
                      <p aria-label='Sign in to make a request'>
                        <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(`/catalogue/${track.id}?tab=requests`)}`}>
                          Sign in
                        </Link>{' '}
                        to make a request.
                      </p>
                    )}
                    {requestUpdateError && <p className='cmc-track-comment-message cmc-track-comment-message--error' role='alert'>{requestUpdateError}</p>}
                    {requestUpdateStatus && <p className='cmc-track-comment-message' role='status'>{requestUpdateStatus}</p>}
                  </div>
                </section>
              )}
            </div>
          </section>
        </section>

        {renderBackButton('cmc-track-back-button--footer')}
      </div>

      {showCartConfirmation && (
        <div
          aria-labelledby='cart-confirmation-title'
          aria-modal='true'
          className='cmc-modal-shell'
          role='dialog'
          tabIndex='-1'
        >
          <button
            aria-label='Close cart confirmation'
            className='cmc-modal-backdrop'
            onClick={() => setShowCartConfirmation(false)}
            type='button'
          />
          <section className='cmc-modal-card cmc-cart-confirmation'>
            <div className='cmc-modal-header'>
              <p className='cmc-kicker'>Cart updated</p>
              <button
                aria-label='Close cart confirmation'
                className='cmc-modal-close'
                onClick={() => setShowCartConfirmation(false)}
                type='button'
              >
                X
              </button>
            </div>

            <div className='cmc-modal-body'>
              <h2 id='cart-confirmation-title'>{track.title} has been added to your cart.</h2>
              <p>
                You can keep browsing the archive or review your cart when you are ready to complete checkout.
              </p>
            </div>

            <div className='cmc-modal-actions'>
              <Button variant='paper' onClick={() => setShowCartConfirmation(false)}>
                Continue Browsing
              </Button>
              <Button as={Link} href='/cart' variant='ink'>
                View Cart
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default CatalogueTrackDetailContent
