import { getSession } from 'next-auth/react'

import prisma from '/components/prisma'

// Update DB when tracks are bought
export default async function handler(req, res) {
  // Check if user has already purchased the track
  if (req.method === 'GET') {
    try {
      // Use getSession Hook to access current user
      const session = await getSession({ req })

      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })

      // If user is logged in, get all tracks that have been purchased by the user
      if (session?.user) {
        const userTracks = await prisma.TrackOwner.findMany({
          where: { userId: user.id }
        })
        res.status(200).json(userTracks)
      }
    } catch (err) {
      console.log('from API error', err)
      res.status(400).json({ message: 'Something went wrong' })
    }
  }

  // Record the track purchase in the DB
  if (req.method === 'POST') {
    try {
      // Destructure the req.body
      const { ...cartItems } = req.body

      // For clarity, rename the cartItems.tracks to tracks
      const { tracks } = cartItems

      // Use getSession Hook to access current user
      const session = await getSession({ req })

      // Get user ID from session and DB
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })

      // Loop through the cartItems and update the DB
      for (var itemIndex in tracks) {
        const updater = await prisma.TrackOwner.create({
          data: {
            userId: user.id,
            trackId: tracks[itemIndex].id
          }
        })
      }

      res.status(200).json(tracks, "You've just bought some tracks!")
      return 'success!'
    } catch (err) {
      console.log('from API error', err)
      res.status(400).json({ message: 'Something POST went wrong' })
    }
  }
}
