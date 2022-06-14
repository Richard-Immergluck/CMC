import prisma from '/components/prisma'

export default async function getTrackById(req, res) {
  const track = await prisma.track.findUnique({
    where: {
      id: req.query.id
    }
  })
  res.status(200).json(track)
}
