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
        {wordmark === 'initials' || wordmark === 'navFull' ? (
          <Image
            className='cmc-brand__lettering'
            src='/brand/logo/cmc-wordmark-charcoal-final.png'
            width='342'
            height='115'
            sizes='(max-width: 480px) 112px, 184px'
            alt=''
            aria-hidden='true'
            priority
          />
        ) : (
          <span className='cmc-brand__name'>Classical Music Catalogue</span>
        )}
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
