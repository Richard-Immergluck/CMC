import prisma from '/components/prisma'

export default async function getTrackById(req, res) {
  const trackId = Number(req.query.trackId)

  if (!Number.isInteger(trackId)) {
    return res.status(400).json({ message: 'Invalid track id' })
  }

  const track = await prisma.track.findUnique({
    where: {
      id: trackId
    }
  })

  if (!track) {
    return res.status(404).json({ message: 'Track not found' })
  }

  return res.status(200).json(track)
}
