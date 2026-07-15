'use client'

import Link from 'next/link'
import { Container, Form } from 'react-bootstrap'
import BrandDisplayText from '../../brand/BrandDisplayText'
import Pagination from '../../ui/Pagination'
import { Button } from '../../ui/primitives'
import {
  worksAndCollectionsCatalogueTypes,
  worksAndCollectionsTypeLabels
} from '../../../lib/pricing-policy.mjs'
import {
  createWorksCollectionHref
} from '../../../lib/works-collection-search.mjs'
import {
  worksCollectionBrowseCategories
} from '../../../lib/works-collection-tags.mjs'

const sortLabels = {
  newest: 'Newest',
  price_asc: 'Price low-high',
  price_desc: 'Price high-low',
  title: 'Title'
}

const createClearSearchHref = query => createWorksCollectionHref({
  page: 1,
  query,
  updates: {
    q: ''
  }
})

const WorksCollectionsPageContent = ({ collections, filterOptions, pagination, query }) => {
  const renderPagination = ariaLabel => (
    <Pagination
      ariaLabel={ariaLabel}
      createHref={page => createWorksCollectionHref({ page, query })}
      page={pagination.page}
      pageCount={pagination.pageCount}
    />
  )

  return (
    <main className='cmc-catalogue-page cmc-works-page'>
      <Container fluid='xl'>
        <section className='cmc-catalogue-board cmc-works-board' aria-labelledby='works-heading'>
          <div className='cmc-catalogue-board-rail' aria-hidden='true' />

          <header className='cmc-catalogue-board-header cmc-works-board-header'>
            <h1 id='works-heading'>
              <BrandDisplayText text='Works & Collections' />
            </h1>

            <Form action='/works-collections' className='cmc-catalogue-query-form cmc-works-query-form' method='get'>
              <Form.Group controlId='works-search' className='cmc-catalogue-search'>
                <Form.Label className='visually-hidden'>Search Works and Collections</Form.Label>
                <div className='cmc-catalogue-search-field'>
                  <Form.Control
                    defaultValue={query.q}
                    inputMode='search'
                    name='q'
                    placeholder='Search'
                    type='text'
                  />
                  {query.q && (
                    <Link
                      aria-label='Clear search'
                      className='cmc-catalogue-search-clear'
                      href={createClearSearchHref(query)}
                    >
                      X
                    </Link>
                  )}
                </div>
              </Form.Group>

              <Form.Group className='cmc-works-category-select' controlId='works-category'>
                <Form.Label>Browse by</Form.Label>
                <Form.Select
                  defaultValue={query.category}
                  name='category'
                  onChange={event => event.currentTarget.form?.requestSubmit()}
                >
                  <option value=''>All Works & Collections</option>
                  {worksCollectionBrowseCategories.map(category => (
                    <option key={category.slug} value={category.slug}>{category.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <div className='cmc-works-filter-grid'>
                <Form.Group className='cmc-catalogue-filter-control' controlId='works-composer'>
                  <Form.Label>Composer</Form.Label>
                  <Form.Select
                    defaultValue={query.composer}
                    name='composer'
                    onChange={event => event.currentTarget.form?.requestSubmit()}
                  >
                    <option value=''>All</option>
                    {filterOptions.composers.map(composer => (
                      <option key={composer} value={composer}>{composer}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className='cmc-catalogue-filter-control' controlId='works-type'>
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    defaultValue={query.catalogueType}
                    name='catalogueType'
                    onChange={event => event.currentTarget.form?.requestSubmit()}
                  >
                    <option value=''>All</option>
                    {worksAndCollectionsCatalogueTypes.map(type => (
                      <option key={type} value={type}>{worksAndCollectionsTypeLabels[type]}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className='cmc-catalogue-filter-control' controlId='works-sort'>
                  <Form.Label>Sort</Form.Label>
                  <Form.Select
                    defaultValue={query.sort}
                    name='sort'
                    onChange={event => event.currentTarget.form?.requestSubmit()}
                  >
                    {Object.entries(sortLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className='cmc-catalogue-filter-control' controlId='works-page-size'>
                  <Form.Label>Page size</Form.Label>
                  <Form.Select
                    defaultValue={query.pageSize}
                    name='pageSize'
                    onChange={event => event.currentTarget.form?.requestSubmit()}
                  >
                    {[10, 25, 50].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              <button className='visually-hidden' type='submit'>Search Works and Collections</button>
            </Form>
          </header>

          <nav aria-label='Browse Works and Collections by category' className='cmc-works-category-rail'>
            <span>Browse by</span>
            <Link
              aria-current={!query.category ? 'page' : undefined}
              className={!query.category ? 'cmc-works-category-link cmc-works-category-link--active' : 'cmc-works-category-link'}
              href={createWorksCollectionHref({ page: 1, query, updates: { category: '' } })}
            >
              All
            </Link>
            {worksCollectionBrowseCategories.map(category => (
              <Link
                aria-current={query.category === category.slug ? 'page' : undefined}
                className={query.category === category.slug ? 'cmc-works-category-link cmc-works-category-link--active' : 'cmc-works-category-link'}
                href={createWorksCollectionHref({ page: 1, query, updates: { category: category.slug } })}
                key={category.slug}
              >
                {category.label}
              </Link>
            ))}
          </nav>

          <div className='cmc-catalogue-toolbar cmc-works-toolbar'>
            <span>Showing {pagination.showingFrom}-{pagination.showingTo} of {pagination.total} works</span>
            {renderPagination('Works and Collections pagination')}
          </div>

          <section className='cmc-works-results' aria-label='Works and Collections results'>
            <div className='cmc-works-table-header' aria-hidden='true'>
              <span>Title</span>
              <span>Composer</span>
              <span>Type</span>
              <span>Tracks</span>
              <span>Uploader</span>
              <span>Price</span>
              <span>Actions</span>
            </div>

            <div className='cmc-works-list'>
              {collections.map(collection => (
                <article className='cmc-works-card' key={collection.id}>
                  <div className='cmc-works-card-title'>
                    <h2>
                      <Link href={`/works-collections/${collection.id}`}>{collection.title}</Link>
                    </h2>
                    {collection.tags.length > 0 && (
                      <ul aria-label='Discovery tags' className='cmc-works-card-tags'>
                        {collection.tags.map(tag => <li key={tag.slug}>{tag.label}</li>)}
                      </ul>
                    )}
                  </div>
                  <p data-label='Composer'>{collection.displayComposer}</p>
                  <p data-label='Type'>{worksAndCollectionsTypeLabels[collection.catalogueType] || 'Collection'}</p>
                  <p data-label='Tracks'>{collection.trackCount}</p>
                  <p data-label='Uploader'>{collection.uploaderName}</p>
                  <p data-label='Price'>{collection.formattedPrice}</p>
                  <div className='cmc-works-card-action'>
                    <Button as={Link} href={`/works-collections/${collection.id}`} variant='ink'>View</Button>
                  </div>
                </article>
              ))}

              {collections.length === 0 && (
                <div className='cmc-empty-results'>No Works or Collections matched that search.</div>
              )}
            </div>
          </section>

          <div className='cmc-catalogue-bottom-pagination'>
            {renderPagination('Works and Collections pagination at end of results')}
          </div>
        </section>
      </Container>
    </main>
  )
}

export default WorksCollectionsPageContent
