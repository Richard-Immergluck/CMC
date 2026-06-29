import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  requireRouteMethod
} from '../../../lib/server/route-handlers'
import prisma from '../../../lib/server/prisma'
import { createRouteTelemetry } from '../../../lib/server/route-telemetry'
import {
  commentQuerySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['GET'])

export async function GET(request) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/comments',
    event: 'comments.list'
  })

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

    telemetry.complete({
      statusCode: 200,
      trackId,
      commentCount: comments.length
    })

    return jsonResponse(200, comments)
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as PATCH,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
