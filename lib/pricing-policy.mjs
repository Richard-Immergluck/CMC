export const catalogueTypes = {
  singleTrack: 'SINGLE_TRACK',
  movement: 'MOVEMENT',
  songCycle: 'SONG_CYCLE',
  collection: 'COLLECTION',
  learningPack: 'LEARNING_PACK',
  operaExcerpt: 'OPERA_EXCERPT',
  completeWork: 'COMPLETE_WORK'
}

export const saleFormats = {
  individual: 'INDIVIDUAL',
  bundle: 'BUNDLE',
  both: 'BOTH'
}

export const pricingReviewStatuses = {
  autoApproved: 'AUTO_APPROVED',
  needsReview: 'NEEDS_REVIEW',
  approved: 'APPROVED',
  rejected: 'REJECTED'
}

export const pricingBands = {
  [catalogueTypes.singleTrack]: {
    label: 'Single track',
    description: 'A short song, aria, study, or rehearsal track sold on its own.',
    options: [199, 299, 399, 499],
    defaultPricePence: 299,
    reviewThresholdPence: 499
  },
  [catalogueTypes.movement]: {
    label: 'Movement or substantial excerpt',
    description: 'One movement, large aria, concerto section, or similar larger standalone item.',
    options: [299, 399, 499, 699],
    defaultPricePence: 399,
    reviewThresholdPence: 699
  },
  [catalogueTypes.operaExcerpt]: {
    label: 'Opera excerpt',
    description: 'A scene, recitative-plus-aria, cut, or specialist opera rehearsal extract.',
    options: [399, 499, 699, 899],
    defaultPricePence: 499,
    reviewThresholdPence: 699
  },
  [catalogueTypes.learningPack]: {
    label: 'Learning pack',
    description: 'A set of versions, tempi, keys, or practice materials intended to be used together.',
    options: [799, 999, 1299, 1499],
    defaultPricePence: 999,
    reviewThresholdPence: 1499
  },
  [catalogueTypes.songCycle]: {
    label: 'Song cycle',
    description: 'A grouped work where individual songs may also become separate catalogue entries.',
    options: [999, 1499, 1999, 2999],
    defaultPricePence: 1499,
    reviewThresholdPence: 1999
  },
  [catalogueTypes.collection]: {
    label: 'Collection',
    description: 'A curated group of related tracks, repertoire, or study material.',
    options: [999, 1499, 1999, 2999],
    defaultPricePence: 1499,
    reviewThresholdPence: 1999
  },
  [catalogueTypes.completeWork]: {
    label: 'Complete work',
    description: 'A complete opera, large reduction, full work, or unusually substantial upload.',
    options: [1999, 2999, 4999, 7999],
    defaultPricePence: 2999,
    reviewThresholdPence: 2999
  }
}

export const formatPricePence = pricePence => `£${(Number(pricePence) / 100).toFixed(2)}`

export const getPricingBand = catalogueType => pricingBands[catalogueType] || pricingBands[catalogueTypes.singleTrack]

export const isAllowedPriceForCatalogueType = ({ catalogueType, pricePence }) => {
  const band = getPricingBand(catalogueType)
  return band.options.includes(Number(pricePence))
}

export const getPricingReviewStatus = ({ catalogueType, pricePence }) => {
  const band = getPricingBand(catalogueType)
  return Number(pricePence) > band.reviewThresholdPence
    ? pricingReviewStatuses.needsReview
    : pricingReviewStatuses.autoApproved
}
