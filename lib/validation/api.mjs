import * as yup from 'yup'
import { createValidationError } from '../server/api-core.mjs'
import {
  atomicTrackCatalogueTypes,
  catalogueTypes,
  isAllowedPriceForCatalogueType,
  isAtomicTrackCatalogueType,
  isWorksAndCollectionsCatalogueType,
  saleFormats,
  worksAndCollectionsCatalogueTypes
} from '../pricing-policy.mjs'

const positiveInteger = yup
  .number()
  .transform((_, originalValue) => {
    if (Array.isArray(originalValue) || originalValue === '' || originalValue == null) {
      return Number.NaN
    }

    return Number(originalValue)
  })
  .typeError('Must be a positive integer')
  .integer('Must be a positive integer')
  .positive('Must be a positive integer')
  .required('Required')

const nonNegativeInteger = yup
  .number()
  .transform((_, originalValue) => {
    if (Array.isArray(originalValue) || originalValue === '' || originalValue == null) {
      return Number.NaN
    }

    return Number(originalValue)
  })
  .typeError('Must be a non-negative integer')
  .integer('Must be a non-negative integer')
  .min(0, 'Must be a non-negative integer')
  .required('Required')

const optionalNonNegativeInteger = yup
  .number()
  .transform((_, originalValue) => {
    if (originalValue === '' || originalValue == null) {
      return undefined
    }

    if (Array.isArray(originalValue)) {
      return Number.NaN
    }

    return Number(originalValue)
  })
  .typeError('Must be a non-negative integer')
  .integer('Must be a non-negative integer')
  .min(0, 'Must be a non-negative integer')
  .optional()

const optionalPositiveInteger = yup
  .number()
  .transform((_, originalValue) => {
    if (originalValue === '' || originalValue == null) {
      return undefined
    }

    if (Array.isArray(originalValue)) {
      return Number.NaN
    }

    return Number(originalValue)
  })
  .typeError('Must be a positive integer')
  .integer('Must be a positive integer')
  .positive('Must be a positive integer')
  .optional()

const optionalUploadBatchDefaultPrice = yup
  .number()
  .transform((_, originalValue) => {
    if (originalValue === '' || originalValue == null) {
      return null
    }

    if (Array.isArray(originalValue)) {
      return Number.NaN
    }

    return Number(originalValue)
  })
  .typeError('Must be a positive integer')
  .integer('Must be a positive integer')
  .positive('Must be a positive integer')
  .nullable()
  .optional()

const optionalIsoDate = yup
  .date()
  .transform((_, originalValue) => {
    if (originalValue === '' || originalValue == null) {
      return undefined
    }

    if (Array.isArray(originalValue)) {
      return new Date(Number.NaN)
    }

    return new Date(originalValue)
  })
  .typeError('Must be a valid date')
  .optional()

const moneyAmount = yup
  .number()
  .transform((_, originalValue) => {
    if (Array.isArray(originalValue) || originalValue === '' || originalValue == null) {
      return Number.NaN
    }

    return Number(originalValue)
  })
  .typeError('Must be a valid price')
  .positive('Must be a valid price')
  .required('Required')

const textField = yup.string().trim().min(1).max(255).required()
const optionalRedirect = yup.string().oneOf(['1']).optional()

export const trackIdParamSchema = yup
  .object({
    trackId: positiveInteger.required()
  })
  .noUnknown(true)

export const worksCollectionIdParamSchema = yup
  .object({
    collectionId: positiveInteger.required()
  })
  .noUnknown(true)

export const uploadBatchIdParamSchema = yup
  .object({
    batchId: positiveInteger.required()
  })
  .noUnknown(true)

export const positiveIntegerParamSchema = yup
  .object({
    id: positiveInteger.required()
  })
  .noUnknown(true)

export const commentQuerySchema = trackIdParamSchema

export const profileCommentBodySchema = yup
  .object({
    trackId: positiveInteger.required(),
    comment: yup.string().trim().min(1).max(500).required()
  })
  .noUnknown(true)

export const trackRequestBodySchema = yup
  .object({
    trackId: positiveInteger.required(),
    title: yup.string().trim().min(1).max(255).required(),
    notes: yup.string().trim().max(1000).optional()
  })
  .noUnknown(true)

export const trackRequestStatusBodySchema = yup
  .object({
    rejectionNote: yup.string().trim().max(1000).optional(),
    rejectionReason: yup.string().trim().max(120).optional(),
    status: yup.string().oneOf(['OPEN', 'PENDING_DECISION', 'ACCEPTED', 'REJECTED', 'COMPLETED']).required()
  })
  .noUnknown(true)

export const trackRequestPricingProposalBodySchema = yup
  .object({
    catalogueType: yup.string().oneOf(atomicTrackCatalogueTypes).default(catalogueTypes.singleTrack),
    saleFormat: yup.string().oneOf([saleFormats.individual]).default(saleFormats.individual),
    pricePence: positiveInteger.required(),
    currency: yup.string().trim().lowercase().oneOf(['gbp']).default('gbp'),
    justification: yup.string().trim().max(2000).optional()
  })
  .test('proposal-price-within-catalogue-band', 'Request price must use an approved CMC pricing tier for this type', value => {
    if (!value) {
      return false
    }

    return isAllowedPriceForCatalogueType({
      catalogueType: value.catalogueType || catalogueTypes.singleTrack,
      pricePence: value.pricePence
    })
  })
  .noUnknown(true)

export const trackRequestPricingDecisionBodySchema = yup
  .object({
    decision: yup.string().oneOf(['ACCEPTED', 'DECLINED']).required(),
    requesterNote: yup.string().trim().max(1000).optional()
  })
  .noUnknown(true)

export const signedTrackUrlQuerySchema = yup
  .object({
    trackId: positiveInteger.required(),
    mode: yup.string().oneOf(['sample', 'full', 'download', 'review']).default('sample'),
    redirect: optionalRedirect
  })
  .noUnknown(true)

export const uploadSignedUrlBodySchema = yup
  .object({
    fileName: yup
      .string()
      .trim()
      .max(255)
      .matches(/^[^/\\]+\.mp3$/i, 'Only MP3 uploads are currently supported')
      .required(),
    contentType: yup
      .string()
      .oneOf(['audio/mpeg', 'audio/mp3'], 'Only MP3 uploads are currently supported')
      .required()
  })
  .noUnknown(true)

export const checkoutSessionBodySchema = yup
  .object({
    releaseIds: yup.array().of(positiveInteger.required()).max(20).default([]),
    trackIds: yup.array().of(positiveInteger.required()).max(50).default([])
  })
  .test(
    'has-checkout-items',
    'Cart is empty',
    value => {
      const trackCount = value?.trackIds?.length || 0
      const releaseCount = value?.releaseIds?.length || 0

      return trackCount + releaseCount > 0
    }
  )
  .noUnknown(true)

export const simulatedCartBodySchema = yup
  .object({
    tracks: yup
      .array()
      .of(
        yup
          .object({
            id: positiveInteger.required()
          })
          .noUnknown(true)
      )
      .min(1)
      .max(50)
      .required()
  })
  .noUnknown(true)

export const reconcileCheckoutSessionBodySchema = yup
  .object({
    sessionId: yup
      .string()
      .trim()
      .matches(/^cs_/, 'Must be a valid checkout session id')
      .required()
  })
  .noUnknown(true)

export const createTrackBodySchema = yup
  .object({
    title: textField,
    composer: textField,
    key: textField,
    instrumentation: textField,
    newFileName: yup.string().trim().max(1024).required(),
    previewStart: nonNegativeInteger,
    previewEnd: nonNegativeInteger.moreThan(yup.ref('previewStart'), 'Preview end must be after preview start'),
    durationSeconds: optionalNonNegativeInteger,
    sourceContentType: yup.string().trim().max(255).optional(),
    additionalInfo: yup.string().trim().min(1).max(2000).required(),
    price: moneyAmount,
    pricePence: positiveInteger.optional(),
    currency: yup.string().trim().lowercase().oneOf(['gbp']).default('gbp'),
    formattedPrice: yup.string().trim().max(64).optional(),
    catalogueType: yup.string().oneOf(atomicTrackCatalogueTypes).default(catalogueTypes.singleTrack),
    saleFormat: yup.string().oneOf([saleFormats.individual]).default(saleFormats.individual),
    pricingTier: yup.string().trim().max(120).optional(),
    pricingJustification: yup.string().trim().max(2000).optional(),
    downloadName: yup.string().trim().max(255).optional(),
    downloadCount: nonNegativeInteger.default(0),
    fulfilledRequestId: optionalPositiveInteger,
    uploadBatchId: optionalPositiveInteger
  })
  .test('price-within-catalogue-band', 'Price must use an approved CMC pricing tier for this upload type', value => {
    if (!value) {
      return false
    }

    const pricePence = Number.isInteger(Number(value.pricePence))
      ? Number(value.pricePence)
      : Math.round(Number(value.price) * 100)

    return isAllowedPriceForCatalogueType({
      catalogueType: value.catalogueType || catalogueTypes.singleTrack,
      pricePence
    }) && isAtomicTrackCatalogueType(value.catalogueType || catalogueTypes.singleTrack)
  })
  .noUnknown(true)

const worksCollectionBodyShape = {
  catalogueType: yup.string().oneOf(worksAndCollectionsCatalogueTypes).default(catalogueTypes.collection),
  composer: yup.string().trim().max(255).optional(),
  currency: yup.string().trim().lowercase().oneOf(['gbp']).default('gbp'),
  pricePence: positiveInteger.required(),
  pricingJustification: yup.string().trim().max(2000).optional(),
  saleFormat: yup.string().oneOf([saleFormats.bundle, saleFormats.both]).default(saleFormats.both),
  title: textField,
  trackItems: yup
    .array()
    .of(yup.object({
      movementNo: yup.string().trim().max(80).optional(),
      position: optionalPositiveInteger,
      titleInWork: yup.string().trim().max(255).optional(),
      trackId: positiveInteger.required()
    }).noUnknown(true))
    .min(2, 'Choose at least two tracks')
    .max(50, 'Choose 50 tracks or fewer')
    .optional(),
  trackIds: yup
    .array()
    .of(positiveInteger.required())
    .min(2, 'Choose at least two tracks')
    .max(50, 'Choose 50 tracks or fewer')
    .optional()
}

const validateWorksCollectionPricing = value => {
  if (!value) {
    return false
  }

  return isAllowedPriceForCatalogueType({
    catalogueType: value.catalogueType || catalogueTypes.collection,
    pricePence: value.pricePence
  }) && isWorksAndCollectionsCatalogueType(value.catalogueType || catalogueTypes.collection)
}

export const createWorksCollectionBodySchema = yup
  .object(worksCollectionBodyShape)
  .test('works-collection-has-track-items', 'Choose at least two tracks', value => {
    return Boolean(value?.trackItems?.length || value?.trackIds?.length)
  })
  .test('works-collection-price-within-band', 'Price must use an approved CMC pricing tier for this Work or Collection type', value => {
    return validateWorksCollectionPricing(value)
  })
  .noUnknown(true)

export const updateWorksCollectionBodySchema = yup
  .object(worksCollectionBodyShape)
  .test('works-collection-has-track-items', 'Choose at least two tracks', value => {
    return Boolean(value?.trackItems?.length || value?.trackIds?.length)
  })
  .test('works-collection-price-within-band', 'Price must use an approved CMC pricing tier for this Work or Collection type', value => {
    return validateWorksCollectionPricing(value)
  })
  .noUnknown(true)

const uploadBatchBodyShape = {
  defaultComposer: yup.string().trim().max(255).optional(),
  defaultInstrumentation: yup.string().trim().max(255).optional(),
  defaultPricePence: optionalUploadBatchDefaultPrice,
  label: yup.string().trim().max(255).optional()
}

export const createUploadBatchBodySchema = yup
  .object(uploadBatchBodyShape)
  .noUnknown(true)

export const updateUploadBatchBodySchema = yup
  .object({
    ...uploadBatchBodyShape,
    status: yup.string().oneOf(['DRAFT', 'UPLOADING', 'READY_FOR_REVIEW', 'SUBMITTED', 'PARTIALLY_FAILED', 'ARCHIVED']).optional()
  })
  .test('has-upload-batch-update', 'At least one upload batch field is required', value => {
    return Boolean(
      value?.label ||
      value?.defaultComposer ||
      value?.defaultInstrumentation ||
      value?.defaultPricePence ||
      value?.status
    )
  })
  .noUnknown(true)

export const adminUserUpdateBodySchema = yup
  .object({
    role: yup.string().oneOf(['CUSTOMER', 'UPLOADER', 'ADMIN', 'SUPPORT']).optional(),
    accountStatus: yup.string().oneOf(['ACTIVE', 'SUSPENDED', 'CLOSED']).optional(),
    uploaderStatus: yup.string().oneOf(['NOT_REQUESTED', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
    reason: yup.string().trim().max(2000).optional()
  })
  .test('has-admin-update', 'At least one user access field is required', value => {
    return Boolean(value?.role || value?.accountStatus || value?.uploaderStatus)
  })
  .noUnknown(true)

export const adminUserAccessReviewBodySchema = yup
  .object({
    decision: yup.string().oneOf(['approve', 'reject']).required(),
    reviewNote: yup.string().trim().max(2000).optional()
  })
  .noUnknown(true)

export const adminTrackModerationBodySchema = yup
  .object({
    decision: yup.string().oneOf(['approve', 'reject', 'archive']).required(),
    moderationNotes: yup.string().trim().max(2000).optional()
  })
  .noUnknown(true)

export const adminPricingReviewBodySchema = yup
  .object({
    decision: yup.string().oneOf(['approve', 'reject']).required(),
    note: yup.string().trim().max(2000).optional(),
    targetId: positiveInteger.required(),
    targetType: yup.string().oneOf(['track', 'requestProposal']).required()
  })
  .noUnknown(true)

export const adminOperationsQuerySchema = yup
  .object({
    action: yup.string().trim().max(120).optional(),
    auditCategory: yup.string().oneOf(['accountLifecycle']).optional(),
    actorId: yup.string().trim().max(255).optional(),
    entityType: yup.string().trim().max(120).optional(),
    entityId: yup.string().trim().max(255).optional(),
    createdFrom: optionalIsoDate,
    createdTo: optionalIsoDate,
    limit: optionalPositiveInteger.max(100, 'Must be 100 or less').default(25)
  })
  .noUnknown(true)

export const adminSecurityReportQuerySchema = yup
  .object({
    format: yup.string().oneOf(['json', 'csv']).default('json')
  })
  .noUnknown(true)

const toValidationDetails = error => {
  const validationErrors = error.inner?.length ? error.inner : [error]

  return validationErrors.map(validationError => ({
    field: validationError.path || 'request',
    message: validationError.message
  }))
}

export const validateInput = (schema, input, message = 'Invalid request') => {
  try {
    return schema.validateSync(input, {
      abortEarly: false,
      stripUnknown: true
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw createValidationError(message, toValidationDetails(error))
    }

    throw error
  }
}
