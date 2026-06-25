import {
  handleApiError,
  requireCurrentUser,
  requireMethod,
  sendJson
} from '../../../lib/server/api'
import { toUserAdminItem } from '../../../lib/server/admin-core.mjs'
import { requireAdminPermission } from '../../../lib/server/permissions.mjs'
import prisma from '../../../lib/server/prisma'

export default async function handler(req, res) {
  try {
    requireMethod(req, res, ['GET'])

    const user = await requireCurrentUser(req)
    requireAdminPermission(user)

    const users = await prisma.user.findMany({
      orderBy: [
        {
          email: 'asc'
        }
      ],
      take: 100
    })

    return sendJson(res, 200, {
      users: users.map(toUserAdminItem)
    })
  } catch (error) {
    return handleApiError(res, error, req)
  }
}
