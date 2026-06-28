import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  requireRouteMethod
} from '../../lib/server/route-handlers'

const methodNotAllowed = createMethodNotAllowedHandler(['GET'])

export function GET(request) {
  try {
    requireRouteMethod(request, ['GET'])
    return jsonResponse(200, { name: 'API home' })
  } catch (error) {
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as PATCH,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
