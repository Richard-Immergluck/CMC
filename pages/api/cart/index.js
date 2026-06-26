import {
  createForbiddenError,
  handleApiError,
  requireCurrentUser,
  requireMethod,
  sendJson
} from '../../../lib/server/api'
import {
  ensureAllTracksFound,
  ensureNotAlreadyOwned,
  normalizeTrackIds
} from '../../../lib/server/orders-core.mjs'
import prisma from '../../../lib/server/prisma'
import {
  simulatedCartBodySchema,
  validateInput
} from '../../../lib/validation/api.mjs'

// Update DB when tracks are bought
export default async function handler(req, res) {
  try {
    requireMethod(req, res, ['GET', 'POST'])
    const user = await requireCurrentUser(req, res)

    // Check if user has already purchased the track
    if (req.method === 'GET') {
      // If user is logged in, get all tracks that have been purchased by the user
      const userTracks = await prisma.trackOwner.findMany({
        where: { userId: user.id }
      })
      return sendJson(res, 200, userTracks)
    }

    if (process.env.ALLOW_SIMULATED_PURCHASES !== 'true') {
      throw createForbiddenError('Direct purchase fulfilment is disabled. Use verified Stripe checkout.')
    }

    const { tracks } = validateInput(
      simulatedCartBodySchema,
      req.body,
      'Invalid cart request'
    )

    const trackIds = normalizeTrackIds(tracks.map(track => track.id))
    const existingTracks = await prisma.track.findMany({
      where: {
        id: {
          in: trackIds
        }
      },
      select: {
        id: true
      }
    })

    ensureAllTracksFound({
      requestedTrackIds: trackIds,
      tracks: existingTracks
    })

    const existingPurchases = await prisma.trackOwner.findMany({
      where: {
        userId: user.id,
        trackId: {
          in: trackIds
        }
      }
    })

    ensureNotAlreadyOwned(existingPurchases)

    await prisma.$transaction(async tx => {
      for (const trackId of trackIds) {
        await prisma.trackOwner.create({
          data: {
            userId: user.id,
            trackId
          }
        })
      }
    })

    return sendJson(res, 200, tracks)
  } catch (error) {
    return handleApiError(res, error, req)
  }
}
