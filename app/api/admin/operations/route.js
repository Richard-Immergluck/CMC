import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  requireRouteMethod
} from '../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../lib/server/route-auth'
import { getAdminOperationsData } from '../../../../lib/server/admin-operations'
import { requireSupportPermission } from '../../../../lib/server/permissions.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['GET'])

export async function GET(request) {
  try {
    requireRouteMethod(request, ['GET'])

    const user = await requireRouteCurrentUser()
    requireSupportPermission(user)

    return jsonResponse(200, await getAdminOperationsData())
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
