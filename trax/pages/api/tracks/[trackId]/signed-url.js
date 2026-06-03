import { getSession } from 'next-auth/react'
import prisma from '../../../../lib/server/prisma'
import { canAccessFullTrack, getCurrentUser } from '../../../../lib/server/ownership'
import { getSignedTrackUrl } from '../../../../lib/server/s3'

const modes = ['sample', 'full', 'download']

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const trackId = Number(req.query.trackId)
  const mode = req.query.mode || 'sample'

  if (!Number.isInteger(trackId) || !modes.includes(mode)) {
    return res.status(400).json({ message: 'Invalid signed URL request' })
  }

  if (mode === 'sample') {
    const track = await prisma.track.findUnique({
      where: {
        id: trackId
      }
    })

    if (!track) {
      return res.status(404).json({ message: 'Track not found' })
    }

    const url = getSignedTrackUrl({
      key: track.fileName,
      expires: 60
    })

    const sampleUrl = `${url}#t=${track.previewStart},${track.previewEnd}`

    if (req.query.redirect === '1') {
      return res.redirect(302, sampleUrl)
    }

    return res.status(200).json({ url: sampleUrl })
  }

  const session = await getSession({ req })
  const currentUser = await getCurrentUser(session)

  if (!currentUser) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  const { allowed, track } = await canAccessFullTrack({
    userId: currentUser.id,
    trackId
  })

  if (!track) {
    return res.status(404).json({ message: 'Track not found' })
  }

  if (!allowed) {
    return res.status(403).json({ message: 'Track access denied' })
  }

  const url = getSignedTrackUrl({
    key: track.fileName,
    expires: mode === 'download' ? 900 : 300,
    fileName: mode === 'download' ? track.downloadName : undefined
  })

  if (req.query.redirect === '1') {
    return res.redirect(302, url)
  }

  return res.status(200).json({ url })
}
