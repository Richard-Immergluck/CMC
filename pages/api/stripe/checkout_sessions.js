import {
  handleApiError,
  requireCurrentUser,
  requireMethod,
  sendJson
} from '../../../lib/server/api'
import { createCheckoutSessionForTracks } from '../../../lib/server/purchases'
import { getApplicationBaseUrl } from '../../../lib/server/url'
import {
  checkoutSessionBodySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

export default async function handler(req, res) {
  try {
    requireMethod(req, res, ['POST'])

    const user = await requireCurrentUser(req)
    const { trackIds } = validateInput(
      checkoutSessionBodySchema,
      req.body,
      'Invalid checkout request'
    )

    const checkoutSession = await createCheckoutSessionForTracks({
      user,
      trackIds,
      applicationUrl: getApplicationBaseUrl(req)
    })

    return sendJson(res, 200, { url: checkoutSession.url })
  } catch (error) {
    return handleApiError(res, error)
  }
}
