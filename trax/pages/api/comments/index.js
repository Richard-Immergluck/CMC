
import prisma from '/components/prisma'

export default async function handler(req, res) {
  // GET all comments for a track
  if (req.method === 'GET') {
    try {
      const trackId = Number(req.query.trackId)

      // If user is logged in, upload a new comment to the DB
      if (Number.isInteger(trackId)) {
        const comments = await prisma.comment.findMany({
          where: {
            trackId: trackId
          }
        })
        return res.status(200).json(comments)
      } 

      return res.status(400).json({ message: 'Invalid track id' })
    } catch (err) {
      console.log('from API error', err)
      return res.status(400).json({ message: 'Something went wrong' })
    }
  }

  res.setHeader('Allow', 'GET')
  return res.status(405).json({ message: 'Method not allowed' })
}
