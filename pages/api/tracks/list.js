import prisma from '/components/prisma'

export default async function getCatalogue(req, res) {
  const catalogue = await prisma.track.findMany()
  res.status(200).json(catalogue)
}

