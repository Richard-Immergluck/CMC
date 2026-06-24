import prisma from './prisma.js'
import { toTrackCreateData } from './tracks-core.mjs'

export { createDownloadName, normalizeTrackPrice, toTrackCreateData } from './tracks-core.mjs'

export const createUploadedTrack = ({ input, user }) => {
  return prisma.track.create({
    data: toTrackCreateData({ input, user })
  })
}
