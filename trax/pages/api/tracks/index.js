import { getSession } from 'next-auth/react'
import prisma from '/components/prisma'

export default async function handler(req, res) {
  
  // Not POST error
  if (req.method !== 'POST') {
    res.status(500).json({ message: 'Something went wrong' })
  }

  // Upload a single track to DB
  if (req.method === 'POST') {
    try {
      // Destructure the req.body
      const { newFileName, title, composer, previewStart, previewEnd, price, formattedPrice, downloadName, downloadCount } = req.body
      // console.log('req body is', req.body)

      // Use getSession Hook to access current user
      const session = await getSession({ req })

      // DB entry that will be uploaded
      const upTrack = await prisma.track.create({
        data: {
          fileName: newFileName,
          title: title,
          composer: composer,
          uploadedBy: { connect: { email: session?.user?.email } }, // Use session to get email and connect user to track
          previewStart: previewStart,
          previewEnd: previewEnd,
          price: price,
          formattedPrice: formattedPrice,
          downloadName: downloadName,
          downloadCount: downloadCount
        }
      })

      console.log('the new track filename is ====>  ', newFileName)

      res.status(200).json(upTrack, newFileName)

      return newFileName
    } catch (err) {
      console.log('from API error', err)
      res.status(400).json({ message: 'Something went wrong' })
    }
  }
}
