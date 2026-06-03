import { getSession } from 'next-auth/react'

import prisma from '/components/prisma'

// Update DB when tracks are bought
export default async function handler(req, res) {
  // Check if user has already purchased the track
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

  // Record the track purchase in the DB
  if (req.method === 'POST') {
    try {
      if (process.env.ALLOW_SIMULATED_PURCHASES !== 'true') {
        return res.status(403).json({
          message: 'Direct purchase fulfilment is disabled. Use verified Stripe checkout.'
        })
      }

      // Destructure the req.body
      const { ...cartItems } = req.body

      // For clarity, rename the cartItems.tracks to tracks
      const { tracks } = cartItems

      // Use getSession Hook to access current user
      const session = await getSession({ req })

      if (!session?.user?.email) {
        return res.status(401).json({ message: 'Authentication required' })
      }

      // Get user ID from session and DB
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })

      const trackIds = tracks.map(track => Number(track.id))
      const existingTracks = await prisma.track.findMany({
        where: {
          id: {
            in: trackIds
          }
        },
        select: {
          id: true,
          price: true
        }
      })

      if (existingTracks.length !== trackIds.length) {
        return res.status(400).json({ message: 'One or more tracks no longer exist' })
      }

      const existingPurchases = await prisma.trackOwner.findMany({
        where: {
          userId: user.id,
          trackId: {
            in: trackIds
          }
        }
      })

      if (existingPurchases.length > 0) {
        return res.status(409).json({ message: 'One or more tracks are already owned' })
      }

      // Loop through the cartItems and update the DB
      for (var itemIndex in trackIds) {
        await prisma.trackOwner.create({
          data: {
            userId: user.id,
            trackId: trackIds[itemIndex]
          }
        })
      }

      res.status(200).json(tracks)
      return 'success!'
    } catch (err) {
      console.log('from API error', err)
      return res.status(400).json({ message: 'Something POST went wrong' })
    }
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ message: 'Method not allowed' })
}
