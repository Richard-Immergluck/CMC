import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'
import { getCurrentUser } from './ownership'
import { safelyRecordInactiveApiUserRejection } from './route-auth-audit'
import {
  getActiveApiUserPosture,
  requireActiveApiUser,
  requireFreshRouteSessionUser
} from './route-auth-core.mjs'
import {
  ApiError,
  createAuthenticationError,
  createConflictError,
  createForbiddenError,
  createMethodNotAllowedError,
  createNotFoundError,
  createValidationError,
  formatAllowHeader,
  methodAllowed,
  toErrorResponse
} from './api-core.mjs'
import { getOrCreateRequestId, logServerEvent } from './logging'

export {
  ApiError,
  createAuthenticationError,
  createConflictError,
  createForbiddenError,
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

export const requireCurrentUser = async (req, res) => {
  const session = await getServerSession(req, res, authOptions)
  const user = await getCurrentUser(session)

  if (!user) {
    throw createAuthenticationError()
  }

  requireFreshRouteSessionUser({ session, user })

  const activePosture = getActiveApiUserPosture(user)

  if (activePosture.reason === 'inactive_account') {
    await safelyRecordInactiveApiUserRejection({
      reason: activePosture.reason,
      route: req.url,
      user
    })
  }

  return requireActiveApiUser(user)
}

export const handleApiError = (res, error, req) => {
  const requestId = req ? getOrCreateRequestId(req) : undefined

  if (!(error instanceof ApiError)) {
    logServerEvent({
      level: 'error',
      event: 'api.unhandled_error',
      message: error.message,
      requestId,
      metadata: {
        name: error.name,
        stack: error.stack
      }
    })
  }

  if (requestId) {
    res.setHeader('X-Request-Id', requestId)
  }

  const { statusCode, body } = toErrorResponse(error, { requestId })
  return sendJson(res, statusCode, body)
}
