import { getSession } from 'next-auth/react'
import { getCurrentUser } from './ownership'
import {
  ApiError,
  createAuthenticationError,
  createConflictError,
  createMethodNotAllowedError,
  createNotFoundError,
  createValidationError,
  formatAllowHeader,
  methodAllowed,
  toErrorResponse
} from './api-core.mjs'

export {
  ApiError,
  createAuthenticationError,
  createConflictError,
  createNotFoundError,
  createValidationError
}

export const sendJson = (res, statusCode, body) => res.status(statusCode).json(body)

export const requireMethod = (req, res, allowedMethods) => {
  if (methodAllowed(req.method, allowedMethods)) {
    return
  }

  res.setHeader('Allow', formatAllowHeader(allowedMethods))
  throw createMethodNotAllowedError(allowedMethods)
}

export const requireCurrentUser = async req => {
  const session = await getSession({ req })
  const user = await getCurrentUser(session)

  if (!user) {
    throw createAuthenticationError()
  }

  return user
}

export const handleApiError = (res, error) => {
  if (!(error instanceof ApiError)) {
    console.error(error)
  }

  const { statusCode, body } = toErrorResponse(error)
  return sendJson(res, statusCode, body)
}
