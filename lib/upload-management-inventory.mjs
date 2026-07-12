const normalizeSearchValue = value => String(value || '').trim().toLowerCase()

const includesSearch = (value, query) => normalizeSearchValue(value).includes(query)

export const getUploadInventorySearchQuery = value => normalizeSearchValue(value)

export const trackMatchesUploadInventorySearch = ({ query, track }) => {
  const normalizedQuery = getUploadInventorySearchQuery(query)

  if (!normalizedQuery) {
    return true
  }

  const searchableFields = [
    track?.additionalInfo,
    track?.title,
    track?.composer,
    track?.downloadName,
    track?.key,
    track?.instrumentation,
    track?.formattedPrice,
    track?.pricePence,
    ...(track?.collectionMemberships || []).flatMap(membership => [
      membership.collectionTitle,
      membership.collectionType,
      membership.movementNo,
      membership.titleInWork
    ])
  ]

  return searchableFields.some(field => includesSearch(field, normalizedQuery))
}

export const collectionMatchesUploadInventorySearch = ({ collection, query }) => {
  const normalizedQuery = getUploadInventorySearchQuery(query)

  if (!normalizedQuery) {
    return true
  }

  const searchableFields = [
    collection?.title,
    collection?.composer,
    collection?.catalogueType,
    collection?.formattedPrice,
    collection?.pricePence,
    collection?.pricingReviewStatus,
    collection?.saleFormat,
    collection?.status,
    ...(collection?.tracks || []).flatMap(track => [
      track.title,
      track.composer,
      track.movementNo,
      track.titleInWork
    ])
  ]

  return searchableFields.some(field => includesSearch(field, normalizedQuery))
}

export const filterUploadInventoryTracks = ({ query, tracks }) => (
  (tracks || []).filter(track => trackMatchesUploadInventorySearch({
    query,
    track
  }))
)

export const filterUploadInventoryCollections = ({ collections, query }) => (
  (collections || []).filter(collection => collectionMatchesUploadInventorySearch({
    collection,
    query
  }))
)
