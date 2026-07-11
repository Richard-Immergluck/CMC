import {
  createConflictError,
  createValidationError
} from './api-core.mjs'

export const normalizeTrackIds = trackIds => {
  const uniqueTrackIds = [...new Set(trackIds.map(Number))]

  if (
    uniqueTrackIds.length === 0 ||
    uniqueTrackIds.some(trackId => !Number.isInteger(trackId) || trackId <= 0)
  ) {
    throw createValidationError('Cart is empty')
  }

  return uniqueTrackIds
}

export const normalizeReleaseIds = releaseIds => {
  const uniqueReleaseIds = [...new Set(releaseIds.map(Number))]

  if (uniqueReleaseIds.some(releaseId => !Number.isInteger(releaseId) || releaseId <= 0)) {
    throw createValidationError('Cart contains an invalid Work or Collection')
  }

  return uniqueReleaseIds
}

export const ensureCartHasItems = ({ releaseIds = [], trackIds = [] }) => {
  if (releaseIds.length + trackIds.length === 0) {
    throw createValidationError('Cart is empty')
  }
}

export const toMinorUnits = track => {
  if (Number.isInteger(track.pricePence)) {
    return track.pricePence
  }

  return Math.round(Number(track.price || 0) * 100)
}

export const allocateMinorUnits = ({ amountTotal, count }) => {
  if (!Number.isInteger(amountTotal) || amountTotal <= 0 || !Number.isInteger(count) || count <= 0) {
    throw createValidationError('Order total must be greater than zero')
  }

  const baseAmount = Math.floor(amountTotal / count)
  const remainder = amountTotal % count

  return Array.from({ length: count }, (_, index) => baseAmount + (index < remainder ? 1 : 0))
}

export const buildOrderItems = tracks => {
  return tracks.map(track => {
    if (track.status !== 'PUBLISHED') {
      throw createValidationError(`Track "${track.title}" is not available for purchase`)
    }

    const unitAmount = toMinorUnits(track)

    if (unitAmount <= 0) {
      throw createValidationError(`Track "${track.title}" does not have a valid price`)
    }

    return {
      trackId: track.id,
      title: track.title,
      composer: track.composer,
      unitAmount,
      currency: track.currency || 'gbp'
    }
  })
}

export const buildReleaseOrderItems = releases => {
  return releases.flatMap(release => {
    const releaseTracks = release.tracks || []
    const unitAmounts = allocateMinorUnits({
      amountTotal: release.pricePence || 0,
      count: releaseTracks.length
    })

    return releaseTracks.map((item, index) => ({
      trackId: item.track.id,
      sourceReleaseId: release.id,
      sourceReleaseTitle: release.title,
      title: item.titleInWork || item.track.title,
      composer: item.track.composer || release.composer || 'Unknown composer',
      unitAmount: unitAmounts[index],
      currency: release.currency || 'gbp'
    }))
  })
}

export const ensureAllTracksFound = ({ requestedTrackIds, tracks }) => {
  if (tracks.length !== requestedTrackIds.length) {
    throw createValidationError('One or more tracks no longer exist')
  }
}

export const ensureAllReleasesFound = ({ requestedReleaseIds, releases }) => {
  if (releases.length !== requestedReleaseIds.length) {
    throw createValidationError('One or more Works or Collections are no longer available')
  }
}

export const ensureNoDuplicateOrderTracks = items => {
  const trackIds = items.map(item => item.trackId)
  const uniqueTrackIds = new Set(trackIds)

  if (uniqueTrackIds.size !== trackIds.length) {
    throw createConflictError('Cart contains the same track more than once')
  }
}

export const ensureNotAlreadyOwned = existingPurchases => {
  if (existingPurchases.length > 0) {
    throw createConflictError('One or more tracks are already owned')
  }
}

export const calculateOrderTotal = items => {
  const amountTotal = items.reduce((total, item) => total + item.unitAmount, 0)

  if (amountTotal <= 0) {
    throw createValidationError('Order total must be greater than zero')
  }

  return amountTotal
}

export const buildStripeLineItems = orderItems => {
  return orderItems.map(item => ({
    price_data: {
      currency: item.currency,
      product_data: {
        name: `${item.title} - ${item.composer}`
      },
      unit_amount: item.unitAmount
    },
    quantity: 1
  }))
}
