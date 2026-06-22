import { getDemoFixtureBuffer, syntheticFixturesEnabled } from '../../../lib/server/demo-fixtures'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (!syntheticFixturesEnabled()) {
    return res.status(404).json({ message: 'Demo fixtures are not enabled' })
  }

  const fixtureName = Array.isArray(req.query.fixtureName)
    ? req.query.fixtureName[0]
    : req.query.fixtureName
  const audio = getDemoFixtureBuffer(fixtureName)

  if (!audio) {
    return res.status(404).json({ message: 'Demo fixture not found' })
  }

  if (req.query.download === '1') {
    res.setHeader('Content-Disposition', `attachment; filename="${fixtureName}"`)
  }

  res.setHeader('Content-Type', 'audio/wav')
  res.setHeader('Content-Length', audio.length)
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(audio)
}
