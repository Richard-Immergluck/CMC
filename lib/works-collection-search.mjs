import {
  worksAndCollectionsCatalogueTypes
} from './pricing-policy.mjs'
import {
  getWorksCollectionBrowseCategory
} from './works-collection-tags.mjs'

export const defaultWorksPageSize = 25
export const maxWorksPageSize = 50

export const worksCollectionSortValues = [
  'newest',
  'price_asc',
  'price_desc',
  'title'
]

const firstValue = value => Array.isArray(value) ? value[0] : value

const cleanValue = value => `${firstValue(value) || ''}`.trim()

const parsePositiveInt = (value, fallback, max = Number.MAX_SAFE_INTEGER) => {
  const parsed = Number(cleanValue(value))

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback
  }

  return Math.min(parsed, max)
}

export const parseWorksCollectionQuery = searchParams => {
  const catalogueType = cleanValue(searchParams.catalogueType)
  const category = cleanValue(searchParams.category)
  const sort = cleanValue(searchParams.sort)

  return {
    catalogueType: worksAndCollectionsCatalogueTypes.includes(catalogueType) ? catalogueType : '',
    category: getWorksCollectionBrowseCategory(category) ? category : '',
    composer: cleanValue(searchParams.composer),
    page: parsePositiveInt(searchParams.page, 1),
    pageSize: parsePositiveInt(searchParams.pageSize, defaultWorksPageSize, maxWorksPageSize),
    q: cleanValue(searchParams.q),
    sort: worksCollectionSortValues.includes(sort) ? sort : 'title'
  }
}

export const createWorksCollectionHref = ({ page, query, updates = {} }) => {
  const nextQuery = {
    ...query,
    ...updates,
    page
  }
  const params = new URLSearchParams()

  Object.entries({
    q: nextQuery.q,
    category: nextQuery.category,
    composer: nextQuery.composer,
    catalogueType: nextQuery.catalogueType,
    sort: nextQuery.sort,
    pageSize: nextQuery.pageSize,
    page: nextQuery.page
  }).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    }
  })

  const queryString = params.toString()

  return queryString ? `/works-collections?${queryString}` : '/works-collections'
}
