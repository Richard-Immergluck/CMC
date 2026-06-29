import {
  createMethodNotAllowedHandler,
  handleRouteError,
  jsonResponse,
  requireRouteMethod
} from '../../../../../lib/server/route-handlers'
import { createNotFoundError } from '../../../../../lib/server/api-core.mjs'
import { requireRouteCurrentUser } from '../../../../../lib/server/route-auth'
import prisma from '../../../../../lib/server/prisma'
import {
  auditActions,
  buildTrackAccessDeniedMetadata,
  buildTrackSignedUrlIssuedMetadata
} from '../../../../../lib/server/audit-core.mjs'
import { recordAuditEvent } from '../../../../../lib/server/audit'
import {
  getDemoFixtureName,
  syntheticFixturesEnabled
} from '../../../../../lib/server/demo-fixtures'
import { logServerEvent } from '../../../../../lib/server/logging'
import { canAccessFullTrack } from '../../../../../lib/server/ownership'
import { canAccessSupportSurface } from '../../../../../lib/server/permissions.mjs'
import { enforceRouteRateLimit } from '../../../../../lib/server/rate-limit'
import { createRouteTelemetry } from '../../../../../lib/server/route-telemetry'
import {
  getSignedTrackUrl,
  signedUrlExpirySeconds
} from '../../../../../lib/server/s3'
import { publicTrackWhere } from '../../../../../lib/server/tracks-core.mjs'
import { getApplicationBaseUrl } from '../../../../../lib/server/url'
import {
  signedTrackUrlQuerySchema,
  validateInput
} from '../../../../../lib/validation/api.mjs'

const methodNotAllowed = createMethodNotAllowedHandler(['GET'])

const toLegacyRequestHeaders = request => ({
  headers: Object.fromEntries(request.headers.entries())
})

const getSyntheticFixtureUrl = ({ request, track, mode }) => {
  if (!syntheticFixturesEnabled()) {
    return null
  }

  const fixtureName = getDemoFixtureName(track.fileName)

  if (!fixtureName) {
    return null
  }

  const params = mode === 'download' ? '?download=1' : ''
  return `${getApplicationBaseUrl(toLegacyRequestHeaders(request))}/api/demo-fixtures/${fixtureName}${params}`
}

const redirectOrJson = ({ redirect, url }) => {
  if (redirect === '1') {
    return Response.redirect(url, 302)
  }

  return jsonResponse(200, { url })
}

export async function GET(request, { params }) {
  const telemetry = createRouteTelemetry({
    request,
    route: '/api/tracks/[trackId]/signed-url',
    event: 'track.signed_url'
  })
  const { requestId } = telemetry

  try {
    requireRouteMethod(request, ['GET'])

    const routeParams = await params
    const { searchParams } = new URL(request.url)
    const { trackId, mode, redirect } = validateInput(
      signedTrackUrlQuerySchema,
      {
        ...routeParams,
        ...Object.fromEntries(searchParams.entries())
      },
      'Invalid signed URL request'
    )

    if (mode === 'sample') {
      await enforceRouteRateLimit({
        request,
        scope: 'track.signed_url.sample',
        limit: 180,
        windowMs: 5 * 60 * 1000
      })

      const track = await prisma.track.findFirst({
        where: {
          id: trackId,
          ...publicTrackWhere
        }
      })

      if (!track) {
        throw createNotFoundError('Track not found')
      }

      const syntheticFixtureUrl = getSyntheticFixtureUrl({ request, track, mode })
      const expiresSeconds = signedUrlExpirySeconds.sample
      const url = syntheticFixtureUrl || getSignedTrackUrl({
        key: track.fileName,
        expires: expiresSeconds
      })
      const sampleUrl = `${url}#t=${track.previewStart},${track.previewEnd}`

      logServerEvent({
        event: 'track.signed_url_issued',
        message: 'Sample track URL issued',
        requestId,
        metadata: {
          trackId: track.id,
          mode,
          redirect: redirect === '1',
          syntheticFixture: Boolean(syntheticFixtureUrl)
        }
      })

      telemetry.complete({
        statusCode: 200,
        trackId: track.id,
        mode,
        redirect: redirect === '1',
        syntheticFixture: Boolean(syntheticFixtureUrl)
      })

      return redirectOrJson({ redirect, url: sampleUrl })
    }

    const currentUser = await requireRouteCurrentUser()
    await enforceRouteRateLimit({
      request,
      scope: `track.signed_url.${mode}`,
      userId: currentUser.id,
      limit: 120,
      windowMs: 5 * 60 * 1000,
      audit: {
        actorId: currentUser.id,
        entityType: 'Track',
        entityId: trackId,
        route: '/api/tracks/[trackId]/signed-url'
      }
    })

    if (mode === 'review') {
      if (!canAccessSupportSurface(currentUser)) {
        await recordAuditEvent({
          action: auditActions.trackAccessDenied,
          actorId: currentUser.id,
          entityType: 'Track',
          entityId: trackId,
          metadata: buildTrackAccessDeniedMetadata({
            mode,
            reason: 'review_access_denied',
            redirect: redirect === '1',
            route: '/api/tracks/[trackId]/signed-url'
          })
        })

        telemetry.complete({
          statusCode: 403,
          userId: currentUser.id,
          trackId,
          mode,
          outcome: 'review_access_denied'
        })

        return jsonResponse(403, { message: 'Review access denied' })
      }

      const track = await prisma.track.findUnique({
        where: {
          id: trackId
        }
      })

      if (!track) {
        throw createNotFoundError('Track not found')
      }

      const syntheticFixtureUrl = getSyntheticFixtureUrl({ request, track, mode })
      const expiresSeconds = signedUrlExpirySeconds.review
      const url = syntheticFixtureUrl || getSignedTrackUrl({
        key: track.fileName,
        expires: expiresSeconds
      })

      await recordAuditEvent({
        action: auditActions.trackAccessSignedUrlIssued,
        actorId: currentUser.id,
        entityType: 'Track',
        entityId: track.id,
        metadata: buildTrackSignedUrlIssuedMetadata({
          mode,
          redirect: redirect === '1',
          route: '/api/tracks/[trackId]/signed-url',
          syntheticFixture: Boolean(syntheticFixtureUrl),
          expiresSeconds
        })
      })

      logServerEvent({
        event: 'track.signed_url_issued',
        message: 'Review track URL issued',
        requestId,
        metadata: {
          userId: currentUser.id,
          trackId: track.id,
          mode,
          redirect: redirect === '1',
          syntheticFixture: Boolean(syntheticFixtureUrl)
        }
      })

      telemetry.complete({
        statusCode: 200,
        userId: currentUser.id,
        trackId: track.id,
        mode,
        redirect: redirect === '1',
        syntheticFixture: Boolean(syntheticFixtureUrl)
      })

      return redirectOrJson({ redirect, url })
    }

    const { allowed, track } = await canAccessFullTrack({
      userId: currentUser.id,
      trackId
    })

    if (!track) {
      throw createNotFoundError('Track not found')
    }

    if (!allowed) {
      await recordAuditEvent({
        action: auditActions.trackAccessDenied,
        actorId: currentUser.id,
        entityType: 'Track',
        entityId: trackId,
        metadata: buildTrackAccessDeniedMetadata({
          mode,
          reason: 'track_access_denied',
          redirect: redirect === '1',
          route: '/api/tracks/[trackId]/signed-url'
        })
      })

      telemetry.complete({
        statusCode: 403,
        userId: currentUser.id,
        trackId,
        mode,
        outcome: 'track_access_denied'
      })

      return jsonResponse(403, { message: 'Track access denied' })
    }

    const syntheticFixtureUrl = getSyntheticFixtureUrl({ request, track, mode })
    const expiresSeconds = mode === 'download'
      ? signedUrlExpirySeconds.download
      : signedUrlExpirySeconds.full
    const url = syntheticFixtureUrl || getSignedTrackUrl({
      key: track.fileName,
      expires: expiresSeconds,
      fileName: mode === 'download' ? track.downloadName : undefined
    })

    await recordAuditEvent({
      action: auditActions.trackAccessSignedUrlIssued,
      actorId: currentUser.id,
      entityType: 'Track',
      entityId: track.id,
      metadata: buildTrackSignedUrlIssuedMetadata({
        mode,
        redirect: redirect === '1',
        route: '/api/tracks/[trackId]/signed-url',
        syntheticFixture: Boolean(syntheticFixtureUrl),
        expiresSeconds,
        downloadName: mode === 'download' ? track.downloadName : undefined
      })
    })

    logServerEvent({
      event: 'track.signed_url_issued',
      message: 'Owned track URL issued',
      requestId,
      metadata: {
        userId: currentUser.id,
        trackId: track.id,
        mode,
        redirect: redirect === '1',
        syntheticFixture: Boolean(syntheticFixtureUrl)
      }
    })

    telemetry.complete({
      statusCode: 200,
      userId: currentUser.id,
      trackId: track.id,
      mode,
      redirect: redirect === '1',
      syntheticFixture: Boolean(syntheticFixtureUrl)
    })

    return redirectOrJson({ redirect, url })
  } catch (error) {
    telemetry.fail(error)
    return handleRouteError(error, request)
  }
}

export {
  methodNotAllowed as DELETE,
  methodNotAllowed as PATCH,
  methodNotAllowed as POST,
  methodNotAllowed as PUT
}
