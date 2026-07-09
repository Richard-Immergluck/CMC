import {
  catalogueTypes,
  formatPricePence,
  getPricingReviewStatus,
  saleFormats
} from '../pricing-policy.mjs'

export const normalizeTrackPrice = ({ price, pricePence }) => {
  const normalizedPrice = Number(price)
  const normalizedPricePence = Number.isInteger(Number(pricePence))
    ? Number(pricePence)
    : Math.round(normalizedPrice * 100)

  return {
    price: normalizedPrice,
    pricePence: normalizedPricePence
  }
}

export const createDownloadName = ({ title, composer, fallback }) => {
  if (fallback) {
    return fallback
  }

  return `${title}_${composer}.mp3`
}

export const publicTrackWhere = {
  status: 'PUBLISHED',
  moderationStatus: 'APPROVED',
  processingStatus: 'READY'
}

export const toTrackCreateData = ({ input, user }) => {
  const { price, pricePence } = normalizeTrackPrice(input)
  const catalogueType = input.catalogueType || catalogueTypes.singleTrack
  const saleFormat = input.saleFormat || saleFormats.individual
  const pricingReviewStatus = getPricingReviewStatus({
    catalogueType,
    pricePence
  })

  return {
    fileName: input.newFileName,
    title: input.title,
    composer: input.composer,
    status: 'DRAFT',
    moderationStatus: 'PENDING',
    processingStatus: 'READY',
    key: input.key,
    instrumentation: input.instrumentation,
    durationSeconds: input.durationSeconds,
    sourceContentType: input.sourceContentType,
    uploadedBy: {
      connect: {
        id: user.id
      }
    },
    previewStart: input.previewStart,
    previewEnd: input.previewEnd,
    additionalInfo: input.additionalInfo,
    price,
    pricePence,
    currency: input.currency || 'gbp',
    formattedPrice: input.formattedPrice || formatPricePence(pricePence),
    catalogueType,
    saleFormat,
    pricingTier: input.pricingTier,
    pricingReviewStatus,
    pricingJustification: input.pricingJustification,
    downloadName: createDownloadName({
      title: input.title,
      composer: input.composer,
      fallback: input.downloadName
    }),
    downloadCount: input.downloadCount ?? 0
  }
}
