import { getSession } from 'next-auth/react'
import prisma from '/components/prisma'

export default async function handler(req, res) {
  
  // Anything other than POST not accepted
  if (req.method !== 'POST') {
    res.status(500).json({ message: 'Something went wrong' })
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
        formattedPrice,
        downloadName,
        downloadCount } = req.body

      // Use getSession Hook to access current user
      const session = await getSession({ req })

      // Create a new track in the database
      const upTrack = await prisma.track.create({
        data: {
          fileName: newFileName,
          title: title,
          composer: composer,
          key: key,
          instrumentation: instrumentation,
          uploadedBy: { connect: { email: session?.user?.email } }, // Use session to get email and connect user to track
          previewStart: previewStart,
          previewEnd: previewEnd,
          additionalInfo: additionalInfo,
          price: price,
          formattedPrice: formattedPrice,
          downloadName: downloadName,
          downloadCount: downloadCount
        }
      })

      res.status(200).json(upTrack, newFileName)

      return newFileName
    } catch (err) {
      console.log('from API error', err)
      res.status(400).json({ message: 'Something went wrong' })
    }
  }
}
