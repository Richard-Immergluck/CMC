import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  requireRouteMethod
} from '../../../lib/server/route-handlers'
import prisma from '../../../lib/server/prisma'
import {
  commentQuerySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['GET'])

export async function GET(request) {
  try {
    requireRouteMethod(request, ['GET'])

    const { searchParams } = new URL(request.url)
    const { trackId } = validateInput(
      commentQuerySchema,
      Object.fromEntries(searchParams.entries()),
      'Invalid track id'
    )

    const comments = await prisma.comment.findMany({
      where: {
        trackId
      }
    })

    return jsonResponse(200, comments)
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
