import React from 'react'
import Image from 'next/image'

const BrandMark = ({ compact = false, className = '', wordmark = 'full' }) => {
  const classes = [
    'cmc-brand',
    compact ? 'cmc-brand--compact' : '',
    wordmark === 'initials' ? 'cmc-brand--initials' : '',
    wordmark === 'navFull' ? 'cmc-brand--nav-full' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} aria-label='Classical Music Catalogue'>
      <Image
        className='cmc-brand__mark'
        src='/brand/logo/paper-bar-large-transparent.png'
        width='592'
        height='344'
        sizes='(max-width: 480px) 93px, 151px'
        alt=''
        aria-hidden='true'
        priority
      />
      <span className='cmc-brand__wordmark'>
        <span className='cmc-brand__name'>
          {wordmark === 'initials' || wordmark === 'navFull' ? 'CMC' : 'Classical Music Catalogue'}
        </span>
        {wordmark === 'navFull' && (
          <>
            <span className='cmc-brand__divider' aria-hidden='true' />
            <span className='cmc-brand__full-title'>
              <span>Classical Music</span>
              <span>Catalogue</span>
            </span>
          </>
        )}
        {!compact && wordmark !== 'initials' && (
          <span className='cmc-brand__strapline'>Backing tracks for classical musicians</span>
        )}
      </span>
    </span>
  )
}

export default BrandMark
