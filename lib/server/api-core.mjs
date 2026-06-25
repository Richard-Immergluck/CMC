export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.details = details
  }
}

export const isApiError = error => error instanceof ApiError

export const methodAllowed = (method, allowedMethods) => allowedMethods.includes(method)

export const formatAllowHeader = allowedMethods => allowedMethods.join(', ')

export const createMethodNotAllowedError = allowedMethods => {
  return new ApiError(405, `Method not allowed. Use ${formatAllowHeader(allowedMethods)}.`)
}

export const createAuthenticationError = () => {
  return new ApiError(401, 'Authentication required')
}

export const createNotFoundError = message => {
  return new ApiError(404, message)
}

export const createValidationError = (message, details) => {
  return new ApiError(400, message, details)
}

export const createConflictError = message => {
  return new ApiError(409, message)
}

export const toErrorResponse = (error, { requestId } = {}) => {
  if (isApiError(error)) {
    return {
      statusCode: error.statusCode,
      body: {
        message: error.message,
        ...(requestId ? { requestId } : {}),
        ...(error.details ? { details: error.details } : {})
      }
    }
  }

  return {
    statusCode: 500,
    body: {
      message: 'Internal server error',
      ...(requestId ? { requestId } : {})
    }
  }
}
