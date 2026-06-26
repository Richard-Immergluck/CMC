import * as yup from 'yup'
import { createValidationError } from '../server/api-core.mjs'

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

export const commentQuerySchema = trackIdParamSchema

export const profileCommentBodySchema = yup
  .object({
    trackId: positiveInteger.required(),
    comment: yup.string().trim().min(1).max(500).required()
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
    trackIds: yup.array().of(positiveInteger.required()).min(1).max(50).required()
  })
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
    downloadName: yup.string().trim().max(255).optional(),
    downloadCount: nonNegativeInteger.default(0)
  })
  .noUnknown(true)

export const adminUserUpdateBodySchema = yup
  .object({
    role: yup.string().oneOf(['CUSTOMER', 'UPLOADER', 'ADMIN', 'SUPPORT']).optional(),
    accountStatus: yup.string().oneOf(['ACTIVE', 'SUSPENDED', 'CLOSED']).optional(),
    uploaderStatus: yup.string().oneOf(['NOT_REQUESTED', 'PENDING', 'APPROVED', 'REJECTED']).optional()
  })
  .test('has-admin-update', 'At least one user access field is required', value => {
    return Boolean(value?.role || value?.accountStatus || value?.uploaderStatus)
  })
  .noUnknown(true)

export const adminTrackModerationBodySchema = yup
  .object({
    decision: yup.string().oneOf(['approve', 'reject', 'archive']).required(),
    moderationNotes: yup.string().trim().max(2000).optional()
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
