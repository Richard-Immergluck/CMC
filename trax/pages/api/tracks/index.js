import { getSession } from 'next-auth/react'
import prisma from '/components/prisma'

export default async function handler(req, res) {
  
  // Fetch All TRacks
  if (req.method === 'GET') {
    const trackList = await prisma.track.findMany()
    res.status(200).json(trackList)
  }

  // Upload a single track to DB
  if (req.method === 'POST') {
    try {
      // Destructure the req.body
      const { id, title, composer } = req.body

      // console.log('req body is', req.body)

      // Use getSession Hook to access current user
      const session = await getSession({ req })

      // DB entry that will be uploaded
      const upTrack = await prisma.track.create({
        data: {
          id: id,
          title: title,
          composer: composer,
          uploadedBy: { connect: { email: session?.user?.email } } // Use session to get email and coneect user to track
        }
      })

      console.log('the new track id ====>  ', newTrackId)

      res.status(200).json(upTrack, newTrackId)

      return newTrackId
    } catch (err) {
      console.log('from API error', err)
      res.status(400).json({ message: 'Something went wrong' })
    }
  }
}
