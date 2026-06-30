import React from 'react'

const BrandMark = ({ compact = false, className = '' }) => {
  const classes = ['cmc-brand', compact ? 'cmc-brand--compact' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} aria-label='Classical Music Catalogue'>
      <svg
        className='cmc-brand__mark'
        viewBox='0 0 64 64'
        aria-hidden='true'
        focusable='false'
      >
        <path
          d='M12 10h27c7.2 0 13 5.8 13 13v31H25c-7.2 0-13-5.8-13-13V10z'
          fill='var(--cmc-color-accent-strong)'
        />
        <path
          d='M40 11v12h12'
          fill='none'
          stroke='var(--cmc-color-accent-gold)'
          strokeLinejoin='round'
          strokeWidth='4'
        />
        <path
          d='M23 25h23M23 33h23M23 41h17'
          fill='none'
          stroke='var(--cmc-color-accent-contrast)'
          strokeLinecap='round'
          strokeWidth='3'
        />
        <circle cx='45' cy='41' r='4.5' fill='var(--cmc-color-accent-gold)' />
      </svg>
      <span className='cmc-brand__wordmark'>
        <span className='cmc-brand__name'>Classical Music Catalogue</span>
        {!compact && (
          <span className='cmc-brand__strapline'>Backing tracks for classical musicians</span>
        )}
      </span>
    </span>
  )
}

export default BrandMark
