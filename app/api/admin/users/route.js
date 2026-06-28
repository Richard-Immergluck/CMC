import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  requireRouteMethod
} from '../../../../lib/server/route-handlers'
import { requireRouteCurrentUser } from '../../../../lib/server/route-auth'
import { toUserAdminItem } from '../../../../lib/server/admin-core.mjs'
import { requireAdminPermission } from '../../../../lib/server/permissions.mjs'
import prisma from '../../../../lib/server/prisma'

const methodNotAllowed = createMethodNotAllowedHandler(['GET'])

export async function GET(request) {
  try {
    requireRouteMethod(request, ['GET'])

    const user = await requireRouteCurrentUser()
    requireAdminPermission(user)

    const users = await prisma.user.findMany({
      orderBy: [
        {
          email: 'asc'
        }
      ],
      take: 100
    })

    return jsonResponse(200, {
      users: users.map(toUserAdminItem)
    })
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
