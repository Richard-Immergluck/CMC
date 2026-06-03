import { getSession } from 'next-auth/react'
import prisma from '/components/prisma'

export default async function handler(req, res) {

// GET all tracks purchased and uploaded by user
  if (req.method === 'GET') {
    try {

      // Use getSession Hook to access current user
      const session = await getSession({ req })

      if (!session?.user?.email) {
        return res.status(401).json({ message: 'Authentication required' })
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })

      // If user is logged in, get all tracks that have been purchased by the user
      const userTracks = await prisma.trackOwner.findMany({
        where: { userId: user.id }
      })
      return res.status(200).json(userTracks)
    } catch (err) {
      console.log('from API error', err)
      return res.status(400).json({ message: 'Something went wrong' })
    }
  }

  // POST a new comment to the DB
  if (req.method === 'POST') {
    try {
      // Use getSession Hook to access current user
      const session = await getSession({ req })

      if (!session?.user?.email) {
        return res.status(401).json({ message: 'Authentication required' })
      }

      // Destructure the req.body
      const { trackId, comment } = req.body

      // If user is logged in, upload a new comment to the DB
      const newComment = await prisma.comment.create({
        data: {
          content: comment,
          postedBy: { connect: { email: session.user.email } },
          track: { connect: { id: Number(trackId) } } 
        }
      })
      return res.status(200).json(newComment)
    } catch (err) {
      console.log('from API error', err)
      return res.status(400).json({ message: 'Something went wrong' })
    }
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ message: 'Method not allowed' })
}
