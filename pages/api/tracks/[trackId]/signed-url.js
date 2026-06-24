import { getSession } from 'next-auth/react'
import {
  createNotFoundError,
  handleApiError,
  requireMethod,
  sendJson
} from '../../../../lib/server/api'
import prisma from '../../../../lib/server/prisma'
import { getDemoFixtureName, syntheticFixturesEnabled } from '../../../../lib/server/demo-fixtures'
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

      const url = getSyntheticFixtureUrl({ req, track, mode }) || getSignedTrackUrl({
        key: track.fileName,
        expires: 60
      })

      const sampleUrl = `${url}#t=${track.previewStart},${track.previewEnd}`

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

    const url = getSyntheticFixtureUrl({ req, track, mode }) || getSignedTrackUrl({
      key: track.fileName,
      expires: mode === 'download' ? 900 : 300,
      fileName: mode === 'download' ? track.downloadName : undefined
    })

    if (redirect === '1') {
      return res.redirect(302, url)
    }

    return sendJson(res, 200, { url })
  } catch (error) {
    return handleApiError(res, error)
  }
}
