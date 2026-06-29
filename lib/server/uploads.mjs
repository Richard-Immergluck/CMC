import { v4 as uuidv4 } from 'uuid'

export const normalizeS3Prefix = prefix => {
  if (!prefix) {
    return ''
  }

  return prefix.replace(/^\/+/, '').replace(/\/+$/, '') + '/'
}

export const getExtension = fileName => fileName.split('.').pop().toLowerCase()

export const normalizeUploadUserSegment = userId => {
  if (typeof userId !== 'string' || !userId.trim()) {
    throw new Error('A user id is required to create upload object keys')
  }

  const segment = userId.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128)

  if (!segment) {
    throw new Error('A valid user id is required to create upload object keys')
  }

  return segment
}

export const createUploadObjectKey = ({ fileName, keyPrefix, userId, id = uuidv4() }) => {
  const userSegment = normalizeUploadUserSegment(userId)

  return `${normalizeS3Prefix(keyPrefix)}uploads/${userSegment}/${id}.${getExtension(fileName)}`
}
