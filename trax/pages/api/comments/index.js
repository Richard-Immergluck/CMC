
export default async function handler(req, res) {
  // GET all comments for a track
  if (req.method === 'GET') {
    try {
      // Destructure the req.body
      const { trackId } = req.body

      // If user is logged in, upload a new comment to the DB
      if (trackId) {
        const comments = await prisma.Comment.findMany({
          where: {
            trackId: trackId
          }
        })
        res.status(200).json(comments)
      } 
    } catch (err) {
      console.log('from API error', err)
      res.status(400).json({ message: 'Something went wrong' })
    }
  }
}