import { getSession } from 'next-auth/react'
import {
  createNotFoundError,
  handleApiError,
  requireMethod,
  sendJson
} from '../../../../lib/server/api'
import prisma from '../../../../lib/server/prisma'
import { auditActions } from '../../../../lib/server/audit-core.mjs'
import { recordAuditEvent } from '../../../../lib/server/audit'
import { getDemoFixtureName, syntheticFixturesEnabled } from '../../../../lib/server/demo-fixtures'
import { getOrCreateRequestId, logServerEvent } from '../../../../lib/server/logging'
import { canAccessFullTrack, getCurrentUser } from '../../../../lib/server/ownership'
import { getSignedTrackUrl } from '../../../../lib/server/s3'
import { getApplicationBaseUrl } from '../../../../lib/server/url'
import {
  signedTrackUrlQuerySchema,
  validateInput
} from '../../../../lib/validation/api.mjs'

const getSyntheticFixtureUrl = ({ req, track, mode }) => {
  if (!syntheticFixturesEnabled()) {
    return null
  }

  const fixtureName = getDemoFixtureName(track.fileName)

  if (!fixtureName) {
    return null
  }

  const params = mode === 'download' ? '?download=1' : ''
  return `${getApplicationBaseUrl(req)}/api/demo-fixtures/${fixtureName}${params}`
}

export default async function handler(req, res) {
  const requestId = getOrCreateRequestId(req)

  try {
    requireMethod(req, res, ['GET'])

    const { trackId, mode, redirect } = validateInput(
      signedTrackUrlQuerySchema,
      req.query,
      'Invalid signed URL request'
    )

    if (mode === 'sample') {
      const track = await prisma.track.findUnique({
        where: {
          id: trackId
        }
      })

      if (!track) {
        throw createNotFoundError('Track not found')
      }

      const syntheticFixtureUrl = getSyntheticFixtureUrl({ req, track, mode })
      const url = syntheticFixtureUrl || getSignedTrackUrl({
        key: track.fileName,
        expires: 60
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

      if (redirect === '1') {
        return res.redirect(302, sampleUrl)
      }

      return sendJson(res, 200, { url: sampleUrl })
    }

    const session = await getSession({ req })
    const currentUser = await getCurrentUser(session)

    if (!currentUser) {
      return sendJson(res, 401, { message: 'Authentication required' })
    }

    const { allowed, track } = await canAccessFullTrack({
      userId: currentUser.id,
      trackId
    })

    if (!track) {
      throw createNotFoundError('Track not found')
    }

    if (!allowed) {
      return sendJson(res, 403, { message: 'Track access denied' })
    }

    const syntheticFixtureUrl = getSyntheticFixtureUrl({ req, track, mode })
    const url = syntheticFixtureUrl || getSignedTrackUrl({
      key: track.fileName,
      expires: mode === 'download' ? 900 : 300,
      fileName: mode === 'download' ? track.downloadName : undefined
    })

    await recordAuditEvent({
      action: auditActions.trackAccessSignedUrlIssued,
      actorId: currentUser.id,
      entityType: 'Track',
      entityId: track.id,
      metadata: {
        mode,
        downloadName: mode === 'download' ? track.downloadName : undefined
      }
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

    if (redirect === '1') {
      return res.redirect(302, url)
    }

    return sendJson(res, 200, { url })
  } catch (error) {
    return handleApiError(res, error, req)
  }
}
