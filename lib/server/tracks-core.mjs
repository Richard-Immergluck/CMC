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

export const toTrackCreateData = ({ input, user }) => {
  const { price, pricePence } = normalizeTrackPrice(input)

  return {
    fileName: input.newFileName,
    title: input.title,
    composer: input.composer,
    key: input.key,
    instrumentation: input.instrumentation,
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
    formattedPrice: input.formattedPrice || `GBP ${(pricePence / 100).toFixed(2)}`,
    downloadName: createDownloadName({
      title: input.title,
      composer: input.composer,
      fallback: input.downloadName
    }),
    downloadCount: input.downloadCount ?? 0
  }
}

