import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  parseRouteJson,
  requireRouteMethod,
  requireTrustedRouteOrigin
} from '../../../lib/server/route-handlers'
import { createForbiddenError } from '../../../lib/server/api-core.mjs'
import { requireRouteCurrentUser } from '../../../lib/server/route-auth'
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

const methodNotAllowed = createMethodNotAllowedHandler(['GET', 'POST'])

export async function GET(request) {
  try {
    requireRouteMethod(request, ['GET', 'POST'])
    const user = await requireRouteCurrentUser()
    const userTracks = await prisma.trackOwner.findMany({
      where: { userId: user.id }
    })

    return jsonResponse(200, userTracks)
  } catch (error) {
    return handleRouteError(error, request)
  }
}

export async function POST(request) {
  try {
    requireRouteMethod(request, ['GET', 'POST'])
    requireTrustedRouteOrigin(request)
    const user = await requireRouteCurrentUser()

    if (process.env.ALLOW_SIMULATED_PURCHASES !== 'true') {
      throw createForbiddenError('Direct purchase fulfilment is disabled. Use verified Stripe checkout.')
    }

    const body = await parseRouteJson(request)
    const { tracks } = validateInput(
      simulatedCartBodySchema,
      body,
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
        await tx.trackOwner.create({
          data: {
            userId: user.id,
            trackId
          }
        })
      }
    })

    return jsonResponse(200, tracks)
  } catch (error) {
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as PATCH,
  methodNotAllowed as PUT
}
