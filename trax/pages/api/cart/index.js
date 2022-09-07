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

      // Use getSession Hook to access current user
      const session = await getSession({ req })

      // Get user ID from session and DB
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })

      console.log('The user ID is', user.id)
 

      // Loop through the cartItems and update the DB
      for (var arrayObject = 0; arrayObject < cartItems.tracks.length; arrayObject++) {
        // Create a new TrackOwner record in the DB
        const newTrackOwner = await prisma.TrackOwner.create({
          data: {
            userId: user.id,
            trackId: cartItems.tracks[arrayObject].id
          }
        })
      }

      // for (var itemIndex in cartItems) {
      //   // DB update for each item in the cart
      //   const purchasedTrack = await prisma.user.update({
      //     data: {
      //       TrackOwners: {
      //         create: {
      //           purchasedBy: user.id,
      //           purchasedAt: new Date(),
      //           track: { connect: { id: cartItems[itemIndex].id } }
      //         }
      //       }
      //     },
      //     where: {
      //       id: user.id,
      //     }
      //   })
      // }

      res.status(200).json(cartItems, "You've just bought some tracks!")
      return 'success!'
    } catch (err) {
      console.log('from API error', err)
      res.status(400).json({ message: 'Something POST went wrong' })
    }
  }
}
