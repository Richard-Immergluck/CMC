const normalizeSearchValue = value => String(value || '').trim().toLowerCase()

const includesSearch = (value, query) => normalizeSearchValue(value).includes(query)

export const uploadInventoryTrackFilters = {
  all: 'all',
  complete: 'complete',
  incomplete: 'incomplete',
  inCollection: 'inCollection',
  needsCollection: 'needsCollection',
  withActivity: 'withActivity'
}

export const uploadInventoryTrackSorts = {
  activity: 'activity',
  composer: 'composer',
  newest: 'newest',
  title: 'title'
}

export const getUploadInventorySearchQuery = value => normalizeSearchValue(value)

const getTrackActivityCount = track => Number(track?.commentCount || 0) + Number(track?.requestCount || 0)

export const isUploadInventoryTrackMetadataComplete = track => Boolean(
  track?.title &&
  track?.composer &&
  track?.key &&
  track?.instrumentation
)

export const getUploadInventoryTrackFilterCounts = tracks => {
  const initialCounts = {
    [uploadInventoryTrackFilters.all]: 0,
    [uploadInventoryTrackFilters.complete]: 0,
    [uploadInventoryTrackFilters.incomplete]: 0,
    [uploadInventoryTrackFilters.inCollection]: 0,
    [uploadInventoryTrackFilters.needsCollection]: 0,
    [uploadInventoryTrackFilters.withActivity]: 0
  }

  return (tracks || []).reduce((counts, track) => {
    const hasCollection = (track?.collectionMemberships || []).length > 0
    const isComplete = isUploadInventoryTrackMetadataComplete(track)
    const hasActivity = getTrackActivityCount(track) > 0

    counts[uploadInventoryTrackFilters.all] += 1

    if (isComplete) {
      counts[uploadInventoryTrackFilters.complete] += 1
    } else {
      counts[uploadInventoryTrackFilters.incomplete] += 1
    }

    if (hasCollection) {
      counts[uploadInventoryTrackFilters.inCollection] += 1
    } else {
      counts[uploadInventoryTrackFilters.needsCollection] += 1
    }

    if (hasActivity) {
      counts[uploadInventoryTrackFilters.withActivity] += 1
    }

    return counts
  }, initialCounts)
}

export const trackMatchesUploadInventoryFilter = ({ filter, track }) => {
  switch (filter) {
    case uploadInventoryTrackFilters.complete:
      return isUploadInventoryTrackMetadataComplete(track)
    case uploadInventoryTrackFilters.incomplete:
      return !isUploadInventoryTrackMetadataComplete(track)
    case uploadInventoryTrackFilters.inCollection:
      return (track?.collectionMemberships || []).length > 0
    case uploadInventoryTrackFilters.needsCollection:
      return (track?.collectionMemberships || []).length === 0
    case uploadInventoryTrackFilters.withActivity:
      return getTrackActivityCount(track) > 0
    case uploadInventoryTrackFilters.all:
    default:
      return true
  }
}

const compareStrings = (firstValue, secondValue) => (
  String(firstValue || '').localeCompare(String(secondValue || ''), 'en-GB', {
    sensitivity: 'base'
  })
)

export const sortUploadInventoryTracks = ({ sort = uploadInventoryTrackSorts.newest, tracks }) => {
  const sortableTracks = [...(tracks || [])]

  return sortableTracks.sort((firstTrack, secondTrack) => {
    if (sort === uploadInventoryTrackSorts.title) {
      return compareStrings(firstTrack.title, secondTrack.title)
    }

    if (sort === uploadInventoryTrackSorts.composer) {
      return compareStrings(firstTrack.composer, secondTrack.composer) ||
        compareStrings(firstTrack.title, secondTrack.title)
    }

    if (sort === uploadInventoryTrackSorts.activity) {
      return getTrackActivityCount(secondTrack) - getTrackActivityCount(firstTrack) ||
        compareStrings(firstTrack.title, secondTrack.title)
    }

    return Number(secondTrack.uploadedAtSort || 0) - Number(firstTrack.uploadedAtSort || 0) ||
      compareStrings(firstTrack.title, secondTrack.title)
  })
}

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

export const filterAndSortUploadInventoryTracks = ({
  filter = uploadInventoryTrackFilters.all,
  query,
  sort = uploadInventoryTrackSorts.newest,
  tracks
}) => sortUploadInventoryTracks({
  sort,
  tracks: (tracks || []).filter(track => (
    trackMatchesUploadInventorySearch({
      query,
      track
    }) &&
    trackMatchesUploadInventoryFilter({
      filter,
      track
    })
  ))
})

export const filterUploadInventoryCollections = ({ collections, query }) => (
  (collections || []).filter(collection => collectionMatchesUploadInventorySearch({
    collection,
    query
  }))
)
