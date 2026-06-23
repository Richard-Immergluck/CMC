import { getSession } from 'next-auth/react'
import { v4 as uuidv4 } from 'uuid'
import { getSignedTrackUploadUrl } from '../../../lib/server/s3'

const allowedContentTypes = ['audio/mpeg', 'audio/mp3']
const allowedExtensions = ['mp3']

const normalizeS3Prefix = prefix => {
  if (!prefix) {
    return ''
  }

  return prefix.replace(/^\/+/, '').replace(/\/?$/, '/')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const session = await getSession({ req })

  if (!session?.user) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  const { fileName, contentType } = req.body
  const extension = fileName?.split('.').pop()?.toLowerCase()

  if (!allowedContentTypes.includes(contentType) || !allowedExtensions.includes(extension)) {
    return res.status(400).json({ message: 'Only MP3 uploads are currently supported' })
  }

  const key = `${normalizeS3Prefix(process.env.S3_KEY_PREFIX)}${uuidv4()}.${extension}`
  const url = await getSignedTrackUploadUrl({
    key,
    contentType
  })

  return res.status(200).json({
    key,
    url
  })
}
