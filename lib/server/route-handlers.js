import { NextResponse } from 'next/server'
import {
  ApiError,
  createMethodNotAllowedError,
  createValidationError,
  formatAllowHeader,
  methodAllowed,
  toErrorResponse
} from './api-core.mjs'
import { createRequestId, logServerEvent } from './logging'

const getRouteRequestId = request => {
  const incomingRequestId = request?.headers?.get('x-request-id') ||
    request?.headers?.get('x-correlation-id')

  return incomingRequestId || createRequestId()
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
  const headers = {
    ...(error?.headers || {}),
    'X-Request-Id': requestId
  }

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
