import { getSession } from 'next-auth/react'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const trackList = await prisma.track.findMany()
    res.json(trackList)
  }

  if (req.method === 'POST') {
    try {
      const trackData = JSON.stringify(req.body)

      const { title, composer } = req.body

      const session = await getSession({ req })

      const upTrack = await prisma.track.create({
        data: {
          title: title,
          composer: composer,
          uploadedBy: { connect: { email: session?.user?.email } }
        }
      })

      res.status(200).json(upTrack)

      // pull the id of the most recently created track
      const newTrackId = await prisma.track.findMany({
        where: {
          title: title,
          composer: composer
        },
        select: {
          id: true
        },
        orderBy: {
          uploadedAt: 'desc'
        },
        take: 1
      })

      console.log(newTrackId)
      
    } catch (err) {
      console.log('from API error', err)
      res.status(400).json({ message: 'Something went wrong' })
    }
  }

  // if (req.method !== 'POST' && !== 'GET') {
  //   return res.status(405).json({ message: 'Method not allowed' })
  // }
}
