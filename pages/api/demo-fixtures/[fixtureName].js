import {
  createNotFoundError,
  handleApiError,
  requireMethod
} from '../../../lib/server/api'
import { getDemoFixtureBuffer, syntheticFixturesEnabled } from '../../../lib/server/demo-fixtures'

export default function handler(req, res) {
  try {
    requireMethod(req, res, ['GET'])

    if (!syntheticFixturesEnabled()) {
      throw createNotFoundError('Demo fixtures are not enabled')
    }

    const fixtureName = Array.isArray(req.query.fixtureName)
      ? req.query.fixtureName[0]
      : req.query.fixtureName
    const audio = getDemoFixtureBuffer(fixtureName)

    if (!audio) {
      throw createNotFoundError('Demo fixture not found')
    }

    if (req.query.download === '1') {
      res.setHeader('Content-Disposition', `attachment; filename="${fixtureName}"`)
    }

    res.setHeader('Content-Type', 'audio/wav')
    res.setHeader('Content-Length', audio.length)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(audio)
  } catch (error) {
    return handleApiError(res, error, req)
  }
}
