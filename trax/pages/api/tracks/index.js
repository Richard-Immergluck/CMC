import { tracks } from '../../../data/tracks'

export default function handler(req, res) {
  res.status(200).json(tracks)
}