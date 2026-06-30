import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod,
  requireTrustedRouteOrigin
} from '../../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../../lib/server/route-auth'
import { reviewUserAccessChangeRequest } from '../../../../../lib/server/admin-access-requests'
import { requireAdminPermission } from '../../../../../lib/server/permissions.mjs'
import { createRouteTelemetry } from '../../../../../lib/server/route-telemetry'
import {
  adminUserAccessReviewBodySchema,
  positiveIntegerParamSchema,
  validateInput
} from '../../../../../lib/validation/api.mjs'
import { toUserAdminItem } from '../../../../../lib/server/admin-core.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['PATCH'])

export async function PATCH(request, { params }) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/admin/user-access-requests/[requestId]',
    event: 'admin.user_access_review'
  })

  try {
    requireRouteMethod(request, ['PATCH'])
    requireTrustedRouteOrigin(request)

    const admin = await requireRouteCurrentUser()
    requireAdminPermission(admin)

    const routeParams = await params
    const { id: requestId } = validateInput(
      positiveIntegerParamSchema,
      {
        id: routeParams.requestId
      },
      'Invalid access change request id'
    )
    const body = await parseRouteJson(request)
    const input = validateInput(
      adminUserAccessReviewBodySchema,
      body,
      'Invalid access change review request'
    )
    const result = await reviewUserAccessChangeRequest({
      actorId: admin.id,
      requestId,
      decision: input.decision,
      reviewNote: input.reviewNote
    })

    telemetry.complete({
      statusCode: 200,
      adminId: admin.id,
      requestId,
      decision: input.decision
    })

    return jsonResponse(200, {
      user: toUserAdminItem(result.user),
      accessChangeRequest: result.accessChangeRequest
    })
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
