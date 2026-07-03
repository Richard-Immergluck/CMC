'use client'

import { memo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Container, Form } from 'react-bootstrap'
import BrandDisplayText from '../../brand/BrandDisplayText'
import PlaySample from '../../PlaySample'
import { Button } from '../../ui/primitives'

const getTrackDescription = track => {
  const detail = track.additionalInfo || track.instrumentation || track.key

  if (!detail) {
    return 'Preview the sample, inspect the arrangement details, and sign in when you are ready to buy.'
  }

  return detail.length > 150 ? `${detail.slice(0, 147)}...` : detail
}

const sortLabels = {
  composer: 'Composer',
  newest: 'Newest',
  price_asc: 'Price low-high',
  price_desc: 'Price high-low',
  title: 'Title'
}

const createPageHref = ({ page, query }) => {
  const params = new URLSearchParams()

  Object.entries({
    q: query.q,
    composer: query.composer,
    key: query.key,
    instrumentation: query.instrumentation,
    uploader: query.uploader,
    sort: query.sort,
    pageSize: query.pageSize,
    page
  }).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    }
  })

  const queryString = params.toString()

  return queryString ? `/catalogue?${queryString}` : '/catalogue'
}

const createClearSearchHref = query => {
  const params = new URLSearchParams()

  Object.entries({
    composer: query.composer,
    key: query.key,
    instrumentation: query.instrumentation,
    uploader: query.uploader,
    sort: query.sort,
    pageSize: query.pageSize
  }).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    }
  })

  const queryString = params.toString()

  return queryString ? `/catalogue?${queryString}` : '/catalogue'
}

const FilterSelect = ({ label, name, options, value }) => (
  <Form.Group className='cmc-catalogue-filter-control' controlId={`catalogue-${name}`}>
    <Form.Label>{label}</Form.Label>
    <Form.Select
      defaultValue={value}
      name={name}
      onChange={event => event.currentTarget.form?.requestSubmit()}
    >
      <option value=''>All</option>
      {options.map(option => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </Form.Select>
  </Form.Group>
)

const CataloguePageContent = ({ filterOptions, pagination, query, tracks }) => {
  const { data: session } = useSession()
  const [previewTrackId, setPreviewTrackId] = useState(null)
  const isAuthenticated = Boolean(session)
  const previousPage = Math.max(1, pagination.page - 1)
  const nextPage = Math.min(pagination.pageCount, pagination.page + 1)

  return (
    <main className='cmc-catalogue-page'>
      <Container fluid='xl'>
        <section className='cmc-catalogue-board' aria-labelledby='catalogue-heading'>
          <div className='cmc-catalogue-board-rail' aria-hidden='true' />

          <div className='cmc-catalogue-board-header'>
            <div>
              <h1 id='catalogue-heading'>
                <BrandDisplayText text='Browse Archive' />
              </h1>
            </div>

            <Form action='/catalogue' className='cmc-catalogue-query-form' method='get' role='search'>
              <Form.Group controlId='catalogue-search' className='cmc-catalogue-search'>
                <Form.Label className='visually-hidden'>Search catalogue</Form.Label>
                <div className='cmc-catalogue-search-field'>
                  <Form.Control
                    defaultValue={query.q}
                    name='q'
                    placeholder='Search'
                    type='search'
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

              <div className='cmc-catalogue-filter-grid'>
                <FilterSelect
                  label='Composer'
                  name='composer'
                  options={filterOptions.composers}
                  value={query.composer}
                />
                <FilterSelect
                  label='Instrument'
                  name='instrumentation'
                  options={filterOptions.instrumentations}
                  value={query.instrumentation}
                />
                <FilterSelect
                  label='Key'
                  name='key'
                  options={filterOptions.keys}
                  value={query.key}
                />
                <FilterSelect
                  label='Uploader'
                  name='uploader'
                  options={filterOptions.uploaders}
                  value={query.uploader}
                />
                <Form.Group className='cmc-catalogue-filter-control' controlId='catalogue-sort'>
                  <Form.Label>Sort</Form.Label>
                  <Form.Select
                    defaultValue={query.sort}
                    name='sort'
                    onChange={event => event.currentTarget.form?.requestSubmit()}
                  >
                    {Object.entries(sortLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className='cmc-catalogue-filter-control' controlId='catalogue-page-size'>
                  <Form.Label>Page size</Form.Label>
                  <Form.Select
                    defaultValue={query.pageSize}
                    name='pageSize'
                    onChange={event => event.currentTarget.form?.requestSubmit()}
                  >
                    {[10, 25, 50].map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <button className='visually-hidden' type='submit'>Search catalogue</button>
            </Form>
          </div>

          <div className='cmc-catalogue-toolbar'>
            <span>
              Showing {pagination.showingFrom}-{pagination.showingTo} of {pagination.total} tracks
            </span>
            <div className='cmc-catalogue-pagination' aria-label='Catalogue pagination'>
              {pagination.page > 1 ? (
                <Link href={createPageHref({ page: previousPage, query })}>Previous</Link>
              ) : (
                <span aria-disabled='true'>Previous</span>
              )}
              <strong>Page {pagination.page} of {pagination.pageCount}</strong>
              {pagination.page < pagination.pageCount ? (
                <Link href={createPageHref({ page: nextPage, query })}>Next</Link>
              ) : (
                <span aria-disabled='true'>Next</span>
              )}
            </div>
          </div>

          <section className='cmc-catalogue-results-shell' aria-label='Catalogue results'>
            <div className='cmc-catalogue-table-header' aria-hidden='true'>
              <span />
              <span>Title</span>
              <span>Composer</span>
              <span>Key</span>
              <span>Instrumentation</span>
              <span>Uploader</span>
              <span>Price</span>
              <span>Actions</span>
            </div>

            <div className='cmc-catalogue-result-list'>
              {tracks.map((track, index) => (
                <article className='cmc-catalogue-track-card' key={track.id}>
                  <div className='cmc-catalogue-track-row'>
                    <div className='cmc-catalogue-track-index'>{String(pagination.showingFrom + index).padStart(2, '0')}</div>

                    <div className='cmc-catalogue-track-title-cell'>
                      <div className='cmc-catalogue-track-heading'>
                        <Link href={`/catalogue/${track.id}`}>
                          {track.title}
                        </Link>
                        <p>{getTrackDescription(track)}</p>
                      </div>

                      <span className='cmc-catalogue-row-meta'>Published {track.uploadedAt}</span>
                    </div>

                    <div className='cmc-catalogue-track-field' data-label='Composer'>
                      {track.composer || 'Unknown composer'}
                    </div>
                    <div className='cmc-catalogue-track-field' data-label='Key'>
                      {track.key || 'Unspecified'}
                    </div>
                    <div className='cmc-catalogue-track-field' data-label='Instrumentation'>
                      {track.instrumentation || 'Unspecified'}
                    </div>
                    <div className='cmc-catalogue-track-field' data-label='Uploader'>
                      {track.uploaderName}
                    </div>
                    <div className='cmc-catalogue-track-price' data-label='Price'>
                      {track.formattedPrice || 'TBC'}
                    </div>
                    <aside className='cmc-catalogue-track-actions' aria-label={`Actions for ${track.title}`}>
                      <Button as={Link} href={`/catalogue/${track.id}`} variant='secondary'>
                        Details
                      </Button>
                      <Button
                        size='sm'
                        variant={previewTrackId === track.id ? 'secondary' : 'subtle'}
                        onClick={() => setPreviewTrackId(previewTrackId === track.id ? null : track.id)}
                      >
                        {previewTrackId === track.id ? 'Hide Preview' : 'Preview'}
                      </Button>
                      <Button
                        as={Link}
                        href={isAuthenticated ? `/catalogue/${track.id}` : `/auth/signin?callbackUrl=/catalogue/${track.id}`}
                        size='sm'
                        variant='paper'
                      >
                        {isAuthenticated ? 'Open Track' : 'Sign In to Buy'}
                      </Button>
                    </aside>

                    {previewTrackId === track.id && (
                      <div className='cmc-preview-player'>
                        <PlaySample track={track} />
                      </div>
                    )}
                  </div>
                </article>
              ))}

              {tracks.length === 0 && (
                <div className='cmc-empty-results'>
                  No tracks matched that search.
                </div>
              )}
            </div>
          </section>
        </section>
      </Container>
    </main>
  )
}

export default memo(CataloguePageContent)
