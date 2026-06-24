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

export const toMinorUnits = track => {
  if (Number.isInteger(track.pricePence)) {
    return track.pricePence
  }

  return Math.round(Number(track.price || 0) * 100)
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

export const ensureAllTracksFound = ({ requestedTrackIds, tracks }) => {
  if (tracks.length !== requestedTrackIds.length) {
    throw createValidationError('One or more tracks no longer exist')
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

