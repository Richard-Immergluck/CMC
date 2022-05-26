import { getSession } from 'next-auth/react'
import prisma from '/components/prisma'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const trackList = await prisma.track.findMany()
    res.json(trackList)
  }

  if (req.method === 'POST') {
    try {

      // Destructure the req.body
      const { title, composer } = req.body

      // Use getSession Hook to access current user
      const session = await getSession({ req })

      // Create DB entry that will be uploaded
      const upTrack = await prisma.track.create({
        data: {
          title: title,
          composer: composer,
          uploadedBy: { connect: { email: session?.user?.email } } 
        }
      })

      // pull the id of the just created track
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

      res.status(200).json(upTrack, newTrackId)
      
    } catch (err) {
      console.log('from API error', err)
      res.status(400).json({ message: 'Something went wrong' })
    }
  }

  // if (req.method !== 'POST' && !== 'GET') {
  //   return res.status(405).json({ message: 'Method not allowed' })
  // }
}
