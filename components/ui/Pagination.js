import Link from 'next/link'
import { getPaginationPageItems } from '../../lib/pagination.mjs'

const PaginationControl = ({ children, disabled, href, label }) => {
  if (disabled) {
    return (
      <span aria-disabled='true' aria-label={label} className='cmc-pagination-control'>
        {children}
      </span>
    )
  }

  return (
    <Link aria-label={label} className='cmc-pagination-control' href={href}>
      {children}
    </Link>
  )
}

const Pagination = ({ ariaLabel, createHref, page, pageCount }) => {
  const items = getPaginationPageItems({ page, pageCount })
  const isFirstPage = page <= 1
  const isLastPage = page >= pageCount
  const previousPage = Math.max(1, page - 1)
  const nextPage = Math.min(pageCount, page + 1)

  const controls = ({ compact = false } = {}) => (
    <>
      <PaginationControl disabled={isFirstPage} href={createHref(1)} label='First page'>«</PaginationControl>
      <PaginationControl disabled={isFirstPage} href={createHref(previousPage)} label='Previous page'>‹</PaginationControl>
      {compact ? (
        <strong className='cmc-pagination-status'>Page {page} of {pageCount}</strong>
      ) : items.map(item => {
        if (typeof item === 'string') {
          return <span aria-hidden='true' className='cmc-pagination-ellipsis' key={item}>…</span>
        }

        if (item === page) {
          return (
            <strong aria-current='page' className='cmc-pagination-page' key={item}>
              {item}
            </strong>
          )
        }

        return (
          <Link aria-label={`Page ${item}`} className='cmc-pagination-page' href={createHref(item)} key={item}>
            {item}
          </Link>
        )
      })}
      <PaginationControl disabled={isLastPage} href={createHref(nextPage)} label='Next page'>›</PaginationControl>
      <PaginationControl disabled={isLastPage} href={createHref(pageCount)} label='Last page'>»</PaginationControl>
    </>
  )

  return (
    <nav className='cmc-pagination' aria-label={ariaLabel}>
      <div className='cmc-pagination-desktop'>{controls()}</div>
      <div className='cmc-pagination-mobile'>{controls({ compact: true })}</div>
    </nav>
  )
}

export default Pagination
