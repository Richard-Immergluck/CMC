import { getSession } from 'next-auth/react'
import prisma from '../../../components/prisma'

export default async function handler(req, res) {
  // Anything other than POST not accepted
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Upload a single track to DB
  if (req.method === 'POST') {
    try {
      // Destructure the req.body
      const { title,
        composer,
        key,
        instrumentation,
        newFileName,
        previewStart,
        previewEnd,
        additionalInfo,
        price,
        pricePence,
        currency,
        formattedPrice,
        downloadName,
        downloadCount } = req.body

      // Use getSession Hook to access current user
      const session = await getSession({ req })

      if (!session?.user?.email) {
        return res.status(401).json({ message: 'Authentication required' })
      }

      const normalizedPrice = Number(price)
      const normalizedPricePence = Number.isInteger(Number(pricePence))
        ? Number(pricePence)
        : Math.round(normalizedPrice * 100)

      if (!Number.isFinite(normalizedPrice) || normalizedPricePence <= 0) {
        return res.status(400).json({ message: 'A valid price is required' })
      }

      // Create a new track in the database
      const upTrack = await prisma.track.create({
        data: {
          fileName: newFileName,
          title: title,
          composer: composer,
          key: key,
          instrumentation: instrumentation,
          uploadedBy: { connect: { email: session?.user?.email } }, // Use session to get email and connect user to track
          previewStart: Number(previewStart),
          previewEnd: Number(previewEnd),
          additionalInfo: additionalInfo,
          price: normalizedPrice,
          pricePence: normalizedPricePence,
          currency: currency || 'gbp',
          formattedPrice: formattedPrice,
          downloadName: downloadName,
          downloadCount: downloadCount
        }
      })

      return res.status(200).json(upTrack)
    } catch (err) {
      console.log('from API error', err)
      return res.status(400).json({ message: 'Something went wrong' })
    }
  }
}
