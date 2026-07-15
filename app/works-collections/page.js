import WorksCollectionsPageContent from '../../components/features/works-collections/WorksCollectionsPageContent'
import {
  getPublicWorksCollectionFilterOptions,
  getPublicWorksCollectionPage,
  serializePublicWorksCollection
} from '../../lib/server/works-collections.mjs'
import { parseWorksCollectionQuery } from '../../lib/works-collection-search.mjs'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Works & Collections | Classical Music Catalogue'
}

const WorksCollectionsPage = async ({ searchParams }) => {
  const query = parseWorksCollectionQuery(await searchParams || {})
  const [page, filterOptions] = await Promise.all([
    getPublicWorksCollectionPage({ query }),
    getPublicWorksCollectionFilterOptions()
  ])

  return (
    <WorksCollectionsPageContent
      collections={page.collections.map(serializePublicWorksCollection)}
      filterOptions={filterOptions}
      pagination={{
        page: page.page,
        pageCount: page.pageCount,
        pageSize: query.pageSize,
        showingFrom: page.showingFrom,
        showingTo: page.showingTo,
        total: page.total
      }}
      query={{
        ...query,
        page: page.page
      }}
    />
  )
}

export default WorksCollectionsPage
