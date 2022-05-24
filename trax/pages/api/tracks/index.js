import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const trackList = await prisma.track.findMany()
  res.json(trackList)
}
