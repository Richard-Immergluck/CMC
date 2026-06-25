import { handleApiError, requireMethod, sendJson } from '../../lib/server/api'

export default function handler(req, res) {
  try {
    requireMethod(req, res, ['GET'])
    return sendJson(res, 200, { name: 'API home' })
  } catch (error) {
    return handleApiError(res, error, req)
  }
}
