import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod,
  requireTrustedRouteOrigin
} from '../../../../lib/server/route-handlers'
import {
  createForbiddenError,
  createNotFoundError,
  createValidationError
} from '../../../../lib/server/api-core.mjs'
import { requireRouteCurrentUser } from '../../../../lib/server/route-auth'
import prisma from '../../../../lib/server/prisma'
import { enforceRouteRateLimit } from '../../../../lib/server/rate-limit'
import { createRouteTelemetry } from '../../../../lib/server/route-telemetry'
import {
  positiveIntegerParamSchema,
  trackRequestStatusBodySchema,
  validateInput
} from '../../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['PATCH'])

export async function PATCH(request, { params }) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/track-requests/[requestId]',
    event: 'track_request.status_update'
  })

  try {
    requireRouteMethod(request, ['PATCH'])
    requireTrustedRouteOrigin(request)
    const user = await requireRouteCurrentUser()
    await enforceRouteRateLimit({
      request,
      scope: 'track_request.status_update',
      userId: user.id,
      limit: 40,
      windowMs: 5 * 60 * 1000,
      audit: {
        actorId: user.id,
        route: '/api/track-requests/[requestId]'
      }
    })

    const resolvedParams = await params
    const { id: requestId } = validateInput(
      positiveIntegerParamSchema,
      {
        id: resolvedParams?.requestId
      },
      'Invalid track request id'
    )
    const body = await parseRouteJson(request)
    const { rejectionNote, rejectionReason, status } = validateInput(
      trackRequestStatusBodySchema,
      body,
      'Invalid track request status'
    )

    if (status === 'COMPLETED') {
      throw createValidationError('Requests are completed by uploading a fulfilment track')
    }
    const existingRequest = await prisma.trackRequest.findUnique({
      where: {
        id: requestId
      },
      include: {
        track: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    })

    if (!existingRequest || !existingRequest.track) {
      throw createNotFoundError('Track request not found')
    }

    if (existingRequest.track.userId !== user.id) {
      throw createForbiddenError('Only the track uploader can manage request status')
    }

    const updatedRequest = await prisma.trackRequest.update({
      where: {
        id: requestId
      },
      data: {
        rejectionNote: status === 'REJECTED' && rejectionNote ? rejectionNote : null,
        rejectionReason: status === 'REJECTED' && rejectionReason ? rejectionReason : null,
        status
      }
    })

    telemetry.complete({
      statusCode: 200,
      userId: user.id,
      trackId: existingRequest.track.id,
      requestId,
      rejectionReason: status === 'REJECTED' && rejectionReason ? rejectionReason : undefined,
      status
    })

    return jsonResponse(200, updatedRequest)
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as GET,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
