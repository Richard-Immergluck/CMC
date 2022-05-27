import prisma from '/components/prisma'

export default async function handler(req, res) {
  const trackList = await prisma.track.findMany()
  res.status(200).json(trackList)
}
