import { getSession } from 'next-auth/react'
import prisma from '/components/prisma'

// Update DB when tracks are bought
export default async function handler(req, res) {
  // Error if not POST
  if (req.method !== 'POST') {
    res.status(500).json({ message: 'Something went wrong' })
  }

  if (req.method === 'POST') {
    try {
      // Destructure the req.body
      const { ...cartItems } = req.body

      // Use getSession Hook to access current user
      const session = await getSession({ req })

      // Loop through the cartItems and update the DB
      for (var itemIndex in cartItems) {

        console.log(cartItems[itemIndex].id)

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

      res.status(200).json(
        // purchasedTracks
        "You've just bought some tracks!"
      )

      return 'success!'
      // }
    } catch (err) {
      console.log('from API error', err)
      res.status(400).json({ message: 'Something went wrong' })
    }
  }
}
