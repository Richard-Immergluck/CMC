import { createLogEntry, getRequestId } from './logging-core.mjs'

export { createLogEntry, createRequestId, getRequestId, redactLogMetadata } from './logging-core.mjs'

export const logServerEvent = ({ level = 'info', event, message, requestId, metadata }) => {
  const entry = createLogEntry({
    level,
    event,
    message,
    requestId,
    metadata
  })

  const serialized = JSON.stringify(entry)

  if (level === 'error') {
    console.error(serialized)
  } else if (level === 'warn') {
    console.warn(serialized)
  } else {
    console.log(serialized)
  }

  return entry
}

export const getOrCreateRequestId = req => getRequestId(req)
