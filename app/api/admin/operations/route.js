import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  requireRouteMethod
} from '../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../lib/server/route-auth'
import { getAdminOperationsData } from '../../../../lib/server/admin-operations'
import { requireSupportPermission } from '../../../../lib/server/permissions.mjs'
import {
  adminOperationsQuerySchema,
  validateInput
} from '../../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['GET'])

export async function GET(request) {
  try {
    requireRouteMethod(request, ['GET'])

    const user = await requireRouteCurrentUser()
    requireSupportPermission(user)

    const { searchParams } = new URL(request.url)
    const audit = validateInput(
      adminOperationsQuerySchema,
      Object.fromEntries(searchParams.entries()),
      'Invalid operations query'
    )

    return jsonResponse(200, await getAdminOperationsData({ audit }))
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
