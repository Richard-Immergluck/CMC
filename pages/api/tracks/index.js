import {
  handleApiError,
  requireCurrentUser,
  requireMethod,
  sendJson
} from '../../../lib/server/api'
import { createUploadedTrack } from '../../../lib/server/tracks.mjs'
import {
  createTrackBodySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

export default async function handler(req, res) {
  try {
    requireMethod(req, res, ['POST'])

    const user = await requireCurrentUser(req)
    const input = validateInput(createTrackBodySchema, req.body, 'Invalid track upload request')
    const track = await createUploadedTrack({
      input,
      user
    })

    return sendJson(res, 200, track)
  } catch (error) {
    return handleApiError(res, error)
  }
}
