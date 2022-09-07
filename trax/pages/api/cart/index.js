import { getSession } from 'next-auth/react'
import prisma from '/components/prisma'

// Update DB when tracks are bought
export default async function handler(req, res) {
  // Check if user has already purchased the track
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

  // Record the track purchase in the DB
  if (req.method === 'POST') {
    try {
      // Destructure the req.body
      const { ...cartItems } = req.body

      // Use getSession Hook to access current user
      const session = await getSession({ req })

      // Loop through the cartItems and update the DB
      for (var itemIndex in cartItems) {
        // DB update for each item in the cart
        const purchasedTrack = await prisma.user.update({
          data: {
            TrackOwners: {
              create: {
                purchasedBy: session.user.id,
                purchasedAt: new Date(),
                track: { connect: { id: cartItems[itemIndex].id } }
              }
            }
          },
          where: {
            id: session.user.id,
            email: session.user.email
          }
        })
      }

      res.status(200).json(purchasedTracks, "You've just bought some tracks!")
      return 'success!'
    } catch (err) {
      console.log('from API error', err)
      res.status(400).json({ message: 'Something went wrong' })
    }
  }
}
