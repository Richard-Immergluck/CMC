import CataloguePageContent from '../../components/features/catalogue/CataloguePageContent'
import prisma from '../../lib/server/prisma'
import { publicTrackWhere } from '../../lib/server/tracks-core.mjs'

export const dynamic = 'force-dynamic'

const getCatalogueTracks = async () => {
  const tracks = await prisma.track.findMany({
    where: publicTrackWhere,
    include: {
      uploadedBy: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [
      {
        composer: 'asc'
      },
      {
        title: 'asc'
      }
    ]
  })

  return tracks.map(track => ({
    ...track,
    uploadedAt: track.uploadedAt.toLocaleDateString(),
    uploaderName: track.uploadedBy?.name || 'Unknown',
    uploadedBy: null
  }))
}

const CataloguePage = async () => {
  const tracks = await getCatalogueTracks()

  return <CataloguePageContent tracks={tracks} />
}

export default CataloguePage
