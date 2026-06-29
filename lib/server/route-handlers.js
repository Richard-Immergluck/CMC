import { NextResponse } from 'next/server'
import {
  ApiError,
  createForbiddenError,
  createMethodNotAllowedError,
  createValidationError,
  formatAllowHeader,
  methodAllowed,
  toErrorHeaders,
  toErrorResponse
} from './api-core.mjs'
import { createRequestId, logServerEvent, normalizeRequestId } from './logging'
import { getRequestOriginPosture } from './origin-core.mjs'

export const getRouteRequestId = request => {
  const incomingRequestId = request?.headers?.get('x-request-id') ||
    request?.headers?.get('x-correlation-id')

  return normalizeRequestId(incomingRequestId) || createRequestId()
}

export const jsonResponse = (statusCode, body, headers = {}) => {
  return NextResponse.json(body, {
    status: statusCode,
    headers
  })
}

export const requireRouteMethod = (request, allowedMethods) => {
  if (methodAllowed(request.method, allowedMethods)) {
    return
  }

  const error = createMethodNotAllowedError(allowedMethods)
  error.headers = {
    Allow: formatAllowHeader(allowedMethods)
  }
  throw error
}

export const requireTrustedRouteOrigin = request => {
  const posture = getRequestOriginPosture({
    requestUrl: request?.url,
    originHeader: request?.headers?.get('origin'),
    refererHeader: request?.headers?.get('referer'),
    trustedOrigins: [
      process.env.NEXTAUTH_URL
    ]
  })

  if (!posture.trusted) {
    throw createForbiddenError('Cross-origin request rejected')
  }
}

export const createMethodNotAllowedHandler = allowedMethods => request => {
  try {
    requireRouteMethod(request, allowedMethods)
  } catch (error) {
    return handleRouteError(error, request)
  }
}

export const parseRouteJson = async request => {
  try {
    return await request.json()
  } catch {
    throw createValidationError('Invalid JSON request body')
  }
}

export const handleRouteError = (error, request) => {
  const requestId = getRouteRequestId(request)
  const headers = toErrorHeaders(error, { requestId })

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

  const { statusCode, body } = toErrorResponse(error, { requestId })
  return jsonResponse(statusCode, body, headers)
}
