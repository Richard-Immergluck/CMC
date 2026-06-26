import {
  handleApiError,
  requireCurrentUser,
  requireMethod,
  sendJson
} from '../../../lib/server/api'
import { getAdminOperationsData } from '../../../lib/server/admin-operations'
import { requireSupportPermission } from '../../../lib/server/permissions.mjs'

export default async function handler(req, res) {
  try {
    requireMethod(req, res, ['GET'])

    const user = await requireCurrentUser(req, res)
    requireSupportPermission(user)

    return sendJson(res, 200, await getAdminOperationsData())
  } catch (error) {
    return handleApiError(res, error, req)
  }
}
