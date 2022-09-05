import { getSession } from 'next-auth/react'
import prisma from '/components/prisma'

export default async function handler(req, res) {

// GET all tracks purchased and uploaded by user
  if (req.method === 'GET') {
    try {

      // Use getSession Hook to access current user
      const session = await getSession({ req })

      // If user is logged in, get all tracks that have been purchased by the user
      if (session?.user) {
        const userTracks = await prisma.TrackOwner.findMany({
          where: { userId: session.user.id }
        })
        res.status(200).json(userTracks)
      } 
    } catch (err) {
      console.log('from API error', err)
      res.status(400).json({ message: 'Something went wrong' })
    }
  }

  // POST a new comment to the DB
  if (req.method === 'POST') {
    try {
      // Use getSession Hook to access current user
      const session = await getSession({ req })

      // Destructure the req.body
      const { trackId, comment, userId } = req.body

      // If user is logged in, upload a new comment to the DB
      if (session?.user) {
        const newComment = await prisma.Comment.create({
          data: {
            content: comment,
            postedBy: { connect: { email: session?.user?.email } },
            track: { connect: { id: trackId } } 
          }
        })
        res.status(200).json(newComment)
      } 
    } catch (err) {
      console.log('from API error', err)
      res.status(400).json({ message: 'Something went wrong' })
    }
  }
}