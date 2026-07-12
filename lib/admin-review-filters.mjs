const normalizeSearchValue = value => String(value || '').trim().toLowerCase()

const includesSearch = (value, query) => normalizeSearchValue(value).includes(query)

const compareStrings = (firstValue, secondValue) => (
  String(firstValue || '').localeCompare(String(secondValue || ''), 'en-GB', {
    sensitivity: 'base'
  })
)

const toTime = value => {
  const time = new Date(value || 0).getTime()

  return Number.isFinite(time) ? time : 0
}

export const adminUploadBatchFilters = {
  active: 'active',
  all: 'all',
  attention: 'attention',
  completed: 'completed',
  submitted: 'submitted'
}

export const adminUploadBatchSorts = {
  attention: 'attention',
  newest: 'newest',
  status: 'status',
  submitted: 'submitted',
  trackCount: 'trackCount',
  uploader: 'uploader'
}

export const adminWorksCollectionFilters = {
  all: 'all',
  archived: 'archived',
  live: 'live',
  needsChanges: 'needsChanges',
  review: 'review',
  withSales: 'withSales'
}

export const adminWorksCollectionSorts = {
  newest: 'newest',
  price: 'price',
  sales: 'sales',
  status: 'status',
  title: 'title',
  trackCount: 'trackCount'
}

const activeBatchStatuses = new Set(['DRAFT', 'UPLOADING', 'READY_FOR_REVIEW'])
const completedBatchStatuses = new Set(['COMPLETED', 'ARCHIVED'])
const archivedReleaseStatuses = new Set(['ARCHIVED', 'REJECTED'])

export const batchMatchesAdminSearch = ({ batch, query }) => {
  const normalizedQuery = normalizeSearchValue(query)

  if (!normalizedQuery) {
    return true
  }

  const searchableFields = [
    batch?.id,
    batch?.label,
    batch?.status,
    batch?.uploader?.name,
    batch?.uploader?.email,
    ...(batch?.tracks || []).flatMap(track => [
      track.title,
      track.status,
      track.moderationStatus,
      track.processingStatus
    ])
  ]

  return searchableFields.some(field => includesSearch(field, normalizedQuery))
}

export const batchMatchesAdminFilter = ({ batch, filter }) => {
  const status = batch?.status
  const failedTracks = Number(batch?.summary?.failedTracks || 0)

  switch (filter) {
    case adminUploadBatchFilters.active:
      return activeBatchStatuses.has(status)
    case adminUploadBatchFilters.attention:
      return status === 'PARTIALLY_FAILED' || failedTracks > 0
    case adminUploadBatchFilters.completed:
      return completedBatchStatuses.has(status)
    case adminUploadBatchFilters.submitted:
      return status === 'SUBMITTED'
    case adminUploadBatchFilters.all:
    default:
      return true
  }
}

export const getAdminUploadBatchFilterCounts = batches => {
  const initialCounts = {
    [adminUploadBatchFilters.active]: 0,
    [adminUploadBatchFilters.all]: 0,
    [adminUploadBatchFilters.attention]: 0,
    [adminUploadBatchFilters.completed]: 0,
    [adminUploadBatchFilters.submitted]: 0
  }

  return (batches || []).reduce((counts, batch) => {
    counts[adminUploadBatchFilters.all] += 1

    Object.values(adminUploadBatchFilters)
      .filter(filter => filter !== adminUploadBatchFilters.all)
      .forEach(filter => {
        if (batchMatchesAdminFilter({
          batch,
          filter
        })) {
          counts[filter] += 1
        }
      })

    return counts
  }, initialCounts)
}

export const sortAdminUploadBatches = ({ batches, sort = adminUploadBatchSorts.newest }) => (
  [...(batches || [])].sort((firstBatch, secondBatch) => {
    if (sort === adminUploadBatchSorts.attention) {
      return Number(secondBatch.summary?.failedTracks || 0) - Number(firstBatch.summary?.failedTracks || 0) ||
        Number(secondBatch.summary?.pendingReviewTracks || 0) - Number(firstBatch.summary?.pendingReviewTracks || 0) ||
        Number(secondBatch.summary?.totalTracks || 0) - Number(firstBatch.summary?.totalTracks || 0) ||
        compareStrings(firstBatch.label, secondBatch.label)
    }

    if (sort === adminUploadBatchSorts.status) {
      return compareStrings(firstBatch.status, secondBatch.status) ||
        compareStrings(firstBatch.label, secondBatch.label)
    }

    if (sort === adminUploadBatchSorts.submitted) {
      return toTime(secondBatch.submittedAt) - toTime(firstBatch.submittedAt) ||
        compareStrings(firstBatch.label, secondBatch.label)
    }

    if (sort === adminUploadBatchSorts.trackCount) {
      return Number(secondBatch.summary?.totalTracks || 0) - Number(firstBatch.summary?.totalTracks || 0) ||
        compareStrings(firstBatch.label, secondBatch.label)
    }

    if (sort === adminUploadBatchSorts.uploader) {
      return compareStrings(firstBatch.uploader?.email, secondBatch.uploader?.email) ||
        compareStrings(firstBatch.label, secondBatch.label)
    }

    return toTime(secondBatch.createdAt) - toTime(firstBatch.createdAt) ||
      compareStrings(firstBatch.label, secondBatch.label)
  })
)

export const filterAndSortAdminUploadBatches = ({
  batches,
  filter = adminUploadBatchFilters.all,
  query,
  sort = adminUploadBatchSorts.newest
}) => sortAdminUploadBatches({
  batches: (batches || []).filter(batch => (
    batchMatchesAdminSearch({
      batch,
      query
    }) &&
    batchMatchesAdminFilter({
      batch,
      filter
    })
  )),
  sort
})

export const releaseMatchesAdminSearch = ({ query, release }) => {
  const normalizedQuery = normalizeSearchValue(query)

  if (!normalizedQuery) {
    return true
  }

  const searchableFields = [
    release?.id,
    release?.title,
    release?.catalogueType,
    release?.status,
    release?.pricingReviewStatus,
    release?.saleFormat,
    release?.formattedPrice,
    release?.pricePence,
    release?.uploader?.name,
    release?.uploader?.email,
    ...(release?.tracks || []).flatMap(track => [
      track.title,
      track.movementNo,
      track.formattedPrice,
      track.pricePence
    ])
  ]

  return searchableFields.some(field => includesSearch(field, normalizedQuery))
}

export const releaseMatchesAdminFilter = ({ filter, release }) => {
  const status = release?.status

  switch (filter) {
    case adminWorksCollectionFilters.archived:
      return archivedReleaseStatuses.has(status)
    case adminWorksCollectionFilters.live:
      return status === 'PUBLISHED'
    case adminWorksCollectionFilters.needsChanges:
      return status === 'NEEDS_CHANGES'
    case adminWorksCollectionFilters.review:
      return status === 'SUBMITTED' || release?.pricingReviewStatus === 'NEEDS_REVIEW'
    case adminWorksCollectionFilters.withSales:
      return Number(release?.orderItemCount || 0) > 0
    case adminWorksCollectionFilters.all:
    default:
      return true
  }
}

export const getAdminWorksCollectionFilterCounts = releases => {
  const initialCounts = {
    [adminWorksCollectionFilters.all]: 0,
    [adminWorksCollectionFilters.archived]: 0,
    [adminWorksCollectionFilters.live]: 0,
    [adminWorksCollectionFilters.needsChanges]: 0,
    [adminWorksCollectionFilters.review]: 0,
    [adminWorksCollectionFilters.withSales]: 0
  }

  return (releases || []).reduce((counts, release) => {
    counts[adminWorksCollectionFilters.all] += 1

    Object.values(adminWorksCollectionFilters)
      .filter(filter => filter !== adminWorksCollectionFilters.all)
      .forEach(filter => {
        if (releaseMatchesAdminFilter({
          filter,
          release
        })) {
          counts[filter] += 1
        }
      })

    return counts
  }, initialCounts)
}

export const sortAdminWorksCollections = ({
  releases,
  sort = adminWorksCollectionSorts.newest
}) => (
  [...(releases || [])].sort((firstRelease, secondRelease) => {
    if (sort === adminWorksCollectionSorts.price) {
      return Number(secondRelease.pricePence || 0) - Number(firstRelease.pricePence || 0) ||
        compareStrings(firstRelease.title, secondRelease.title)
    }

    if (sort === adminWorksCollectionSorts.sales) {
      return Number(secondRelease.orderItemCount || 0) - Number(firstRelease.orderItemCount || 0) ||
        compareStrings(firstRelease.title, secondRelease.title)
    }

    if (sort === adminWorksCollectionSorts.status) {
      return compareStrings(firstRelease.status, secondRelease.status) ||
        compareStrings(firstRelease.title, secondRelease.title)
    }

    if (sort === adminWorksCollectionSorts.title) {
      return compareStrings(firstRelease.title, secondRelease.title)
    }

    if (sort === adminWorksCollectionSorts.trackCount) {
      return Number(secondRelease.trackCount || secondRelease.tracks?.length || 0) -
        Number(firstRelease.trackCount || firstRelease.tracks?.length || 0) ||
        compareStrings(firstRelease.title, secondRelease.title)
    }

    return toTime(secondRelease.createdAt) - toTime(firstRelease.createdAt) ||
      compareStrings(firstRelease.title, secondRelease.title)
  })
)

export const filterAndSortAdminWorksCollections = ({
  filter = adminWorksCollectionFilters.all,
  query,
  releases,
  sort = adminWorksCollectionSorts.newest
}) => sortAdminWorksCollections({
  releases: (releases || []).filter(release => (
    releaseMatchesAdminSearch({
      query,
      release
    }) &&
    releaseMatchesAdminFilter({
      filter,
      release
    })
  )),
  sort
})
