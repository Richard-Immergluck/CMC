import { getServerSession } from 'next-auth'
import CataloguePageContent from '../../components/features/catalogue/CataloguePageContent'
import { getCatalogueContext } from '../../lib/catalogue-view.mjs'
import { formatDisplayDate } from '../../lib/date-format.mjs'
import { authOptions } from '../../lib/server/auth'
import { getCurrentUser } from '../../lib/server/ownership'
import prisma from '../../lib/server/prisma'
import { publicTrackWhere } from '../../lib/server/tracks-core.mjs'

export const dynamic = 'force-dynamic'

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 50

const sortOptions = {
  composer: [
    {
      composer: 'asc'
    },
    {
      title: 'asc'
    }
  ],
  newest: [
    {
      uploadedAt: 'desc'
    },
    {
      title: 'asc'
    }
  ],
  price_asc: [
    {
      pricePence: 'asc'
    },
    {
      title: 'asc'
    }
  ],
  price_desc: [
    {
      pricePence: 'desc'
    },
    {
      title: 'asc'
    }
  ],
  title: [
    {
      title: 'asc'
    },
    {
      composer: 'asc'
    }
  ]
}

const firstValue = value => Array.isArray(value) ? value[0] : value

const cleanValue = value => `${firstValue(value) || ''}`.trim()

const parsePositiveInt = (value, fallback, max = Number.MAX_SAFE_INTEGER) => {
  const parsed = Number(cleanValue(value))

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback
  }

  return Math.min(parsed, max)
}

const parseCatalogueQuery = searchParams => {
  const sort = cleanValue(searchParams.sort)

  return {
    composer: cleanValue(searchParams.composer),
    instrumentation: cleanValue(searchParams.instrumentation),
    key: cleanValue(searchParams.key),
    page: parsePositiveInt(searchParams.page, 1),
    pageSize: parsePositiveInt(searchParams.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
    q: cleanValue(searchParams.q),
    sort: Object.hasOwn(sortOptions, sort) ? sort : 'composer',
    uploader: cleanValue(searchParams.uploader)
  }
}

const createContainsFilter = value => ({
  contains: value,
  mode: 'insensitive'
})

const buildCatalogueWhere = (query, { omit } = {}) => {
  const filters = []

  if (query.q) {
    const contains = createContainsFilter(query.q)

    filters.push({
      OR: [
        {
          title: contains
        },
        {
          composer: contains
        },
        {
          key: contains
        },
        {
          instrumentation: contains
        },
        {
          additionalInfo: contains
        },
        {
          uploadedBy: {
            name: contains
          }
        }
      ]
    })
  }

  if (query.composer && omit !== 'composer') {
    filters.push({
      composer: {
        equals: query.composer,
        mode: 'insensitive'
      }
    })
  }

  if (query.key && omit !== 'key') {
    filters.push({
      key: {
        equals: query.key,
        mode: 'insensitive'
      }
    })
  }

  if (query.instrumentation && omit !== 'instrumentation') {
    filters.push({
      instrumentation: {
        equals: query.instrumentation,
        mode: 'insensitive'
      }
    })
  }

  if (query.uploader && omit !== 'uploader') {
    filters.push({
      uploadedBy: {
        name: {
          equals: query.uploader,
          mode: 'insensitive'
        }
      }
    })
  }

  return filters.length > 0
    ? {
        AND: [
          publicTrackWhere,
          ...filters
        ]
      }
    : publicTrackWhere
}

const serializeTrack = track => ({
  ...track,
  collectionMemberships: (track.releaseItems || []).map(releaseItem => ({
    collectionId: releaseItem.release.id,
    collectionFormattedPrice: releaseItem.release.formattedPrice,
    collectionTitle: releaseItem.release.title,
    collectionType: releaseItem.release.catalogueType,
    collectionPricePence: releaseItem.release.pricePence,
    collectionTrackCount: releaseItem.release._count?.tracks || releaseItem.release.tracks?.length || 0,
    individualTracksTotalPence: (releaseItem.release.tracks || []).reduce((total, item) => (
      total + Number(item.track?.pricePence || 0)
    ), 0),
    movementNo: releaseItem.movementNo,
    position: releaseItem.position,
    titleInWork: releaseItem.titleInWork
  })),
  releaseItems: null,
  uploadedAt: formatDisplayDate(track.uploadedAt),
  uploaderName: track.uploadedBy?.name || 'Unknown',
  uploadedBy: null
})

const trackListSelect = {
  additionalInfo: true,
  composer: true,
  formattedPrice: true,
  id: true,
  instrumentation: true,
  key: true,
  pricePence: true,
  previewEnd: true,
  previewStart: true,
  title: true,
  uploadedAt: true,
  userId: true,
  _count: {
    select: {
      Comments: true,
      TrackOwner: true
    }
  },
  releaseItems: {
    where: {
      release: {
        is: {
          status: 'PUBLISHED'
        }
      }
    },
    orderBy: [
      {
        release: {
          title: 'asc'
        }
      },
      {
        position: 'asc'
      }
    ],
    select: {
      movementNo: true,
      position: true,
      titleInWork: true,
      release: {
        select: {
          _count: {
            select: {
              tracks: true
            }
          },
          catalogueType: true,
          formattedPrice: true,
          id: true,
          pricePence: true,
          tracks: {
            select: {
              track: {
                select: {
                  pricePence: true
                }
              }
            }
          },
          title: true
        }
      }
    }
  },
  uploadedBy: {
    select: {
      name: true
    }
  }
}

const toOptionList = values => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))

const getFacetTracks = (query, omit) => prisma.track.findMany({
  where: buildCatalogueWhere(query, { omit }),
  select: {
    composer: true,
    instrumentation: true,
    key: true,
    uploadedBy: {
      select: {
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

const getCatalogueFilterOptions = async query => {
  const [
    composerTracks,
    instrumentationTracks,
    keyTracks,
    uploaderTracks
  ] = await Promise.all([
    getFacetTracks(query, 'composer'),
    getFacetTracks(query, 'instrumentation'),
    getFacetTracks(query, 'key'),
    getFacetTracks(query, 'uploader')
  ])

  return {
    composers: toOptionList(composerTracks.map(track => track.composer)),
    instrumentations: toOptionList(instrumentationTracks.map(track => track.instrumentation)),
    keys: toOptionList(keyTracks.map(track => track.key)),
    uploaders: toOptionList(uploaderTracks.map(track => track.uploadedBy?.name))
  }
}

const getCatalogueTracks = async (query, currentUser) => {
  const where = buildCatalogueWhere(query)
  const total = await prisma.track.count({ where })
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize))
  const page = Math.min(query.page, pageCount)
  const skip = (page - 1) * query.pageSize

  const tracks = await prisma.track.findMany({
    where,
    select: trackListSelect,
    orderBy: sortOptions[query.sort],
    skip,
    take: query.pageSize
  })
  const trackIds = tracks.map(track => track.id)
  const ownedTrackIds = currentUser && trackIds.length > 0
    ? await prisma.trackOwner.findMany({
        where: {
          trackId: {
            in: trackIds
          },
          userId: currentUser.id
        },
        select: {
          trackId: true
        }
      })
    : []
  const ownedTrackIdSet = new Set(ownedTrackIds.map(owner => owner.trackId))

  return {
    page,
    pageCount,
    showingFrom: total === 0 ? 0 : skip + 1,
    showingTo: skip + tracks.length,
    total,
    tracks: tracks.map(track => ({
      ...serializeTrack(track),
      viewerState: {
        isOwned: ownedTrackIdSet.has(track.id),
        isUploadedByViewer: Boolean(currentUser && track.userId === currentUser.id)
      }
    }))
  }
}

const CataloguePage = async ({ searchParams }) => {
  const resolvedSearchParams = await searchParams
  const session = await getServerSession(authOptions)
  const currentUser = await getCurrentUser(session)
  const catalogueContext = getCatalogueContext(currentUser)
  const query = parseCatalogueQuery(resolvedSearchParams || {})
  const [catalogue, filterOptions] = await Promise.all([
    getCatalogueTracks(query, currentUser),
    getCatalogueFilterOptions(query)
  ])

  return (
    <CataloguePageContent
      catalogueContext={catalogueContext}
      filterOptions={filterOptions}
      pagination={{
        page: catalogue.page,
        pageCount: catalogue.pageCount,
        pageSize: query.pageSize,
        showingFrom: catalogue.showingFrom,
        showingTo: catalogue.showingTo,
        total: catalogue.total
      }}
      query={{
        ...query,
        page: catalogue.page
      }}
      tracks={catalogue.tracks}
    />
  )
}

export default CataloguePage
