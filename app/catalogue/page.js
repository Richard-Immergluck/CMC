import CataloguePageContent from '../../components/features/catalogue/CataloguePageContent'
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

const buildCatalogueWhere = query => {
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

  if (query.composer) {
    filters.push({
      composer: {
        equals: query.composer,
        mode: 'insensitive'
      }
    })
  }

  if (query.key) {
    filters.push({
      key: {
        equals: query.key,
        mode: 'insensitive'
      }
    })
  }

  if (query.instrumentation) {
    filters.push({
      instrumentation: {
        equals: query.instrumentation,
        mode: 'insensitive'
      }
    })
  }

  if (query.uploader) {
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
  uploadedAt: track.uploadedAt.toLocaleDateString(),
  uploaderName: track.uploadedBy?.name || 'Unknown',
  uploadedBy: null
})

const toOptionList = values => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))

const getCatalogueFilterOptions = async () => {
  const tracks = await prisma.track.findMany({
    where: publicTrackWhere,
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

  return {
    composers: toOptionList(tracks.map(track => track.composer)),
    instrumentations: toOptionList(tracks.map(track => track.instrumentation)),
    keys: toOptionList(tracks.map(track => track.key)),
    uploaders: toOptionList(tracks.map(track => track.uploadedBy?.name))
  }
}

const getCatalogueTracks = async query => {
  const where = buildCatalogueWhere(query)
  const total = await prisma.track.count({ where })
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize))
  const page = Math.min(query.page, pageCount)
  const skip = (page - 1) * query.pageSize

  const tracks = await prisma.track.findMany({
    where,
    include: {
      uploadedBy: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: sortOptions[query.sort],
    skip,
    take: query.pageSize
  })

  return {
    page,
    pageCount,
    showingFrom: total === 0 ? 0 : skip + 1,
    showingTo: skip + tracks.length,
    total,
    tracks: tracks.map(serializeTrack)
  }
}

const CataloguePage = async ({ searchParams }) => {
  const resolvedSearchParams = await searchParams
  const query = parseCatalogueQuery(resolvedSearchParams || {})
  const [catalogue, filterOptions] = await Promise.all([
    getCatalogueTracks(query),
    getCatalogueFilterOptions()
  ])

  return (
    <CataloguePageContent
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
