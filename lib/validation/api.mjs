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

const optionalRedirect = yup.string().oneOf(['1']).optional()

export const trackIdParamSchema = yup
  .object({
    trackId: positiveInteger.required()
  })
  .noUnknown(true)

export const commentQuerySchema = trackIdParamSchema

export const signedTrackUrlQuerySchema = yup
  .object({
    trackId: positiveInteger.required(),
    mode: yup.string().oneOf(['sample', 'full', 'download']).default('sample'),
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

