import { v4 as uuidv4 } from 'uuid'

export const normalizeS3Prefix = prefix => {
  if (!prefix) {
    return ''
  }

  return prefix.replace(/^\/+/, '').replace(/\/+$/, '') + '/'
}

export const getExtension = fileName => fileName.split('.').pop().toLowerCase()

export const createUploadObjectKey = ({ fileName, keyPrefix, id = uuidv4() }) => {
  return `${normalizeS3Prefix(keyPrefix)}${id}.${getExtension(fileName)}`
}

